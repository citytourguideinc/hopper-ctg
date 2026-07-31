export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/** Normalize any phone to E.164 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length > 11) return '+' + digits;
  return null;
}

const HOPPER_ACTIVE = ['confirmed','pickup_started','at_pickup','ride_active'];
const RECENTLY_MS   = 30 * 60 * 1000;
const TOUR_BEFORE   = 2 * 60 * 60 * 1000;
const TOUR_AFTER    = 2 * 60 * 60 * 1000;

async function matchHopper(phone) {
  const { data: active } = await supabaseAdmin.from('hopper_requests')
    .select('id,guest_name,guest_phone,status,neighborhood,completed_at')
    .in('status', HOPPER_ACTIVE).order('created_at',{ascending:false});
  const { data: recent } = await supabaseAdmin.from('hopper_requests')
    .select('id,guest_name,guest_phone,status,neighborhood,completed_at')
    .eq('status','completed').gt('completed_at', new Date(Date.now()-RECENTLY_MS).toISOString());
  const all = [...(active||[]),...(recent||[])].filter(r=>normalizePhone(r.guest_phone)===phone);
  if (!all.length) return {match:null,ambiguous:false};
  return {match:all[0],ambiguous:all.length>1,count:all.length};
}

async function matchTour(phone) {
  const now=new Date();
  const today=now.toISOString().slice(0,10);
  const yesterday=new Date(now-86400000).toISOString().slice(0,10);
  const {data:bookings}=await supabaseAdmin.from('tour_bookings')
    .select('id,customer_name,customer_phone,booking_date,booking_time,status')
    .in('status',['confirmed','pending']).in('booking_date',[today,yesterday]);
  const matches=(bookings||[]).filter(b=>{
    if(normalizePhone(b.customer_phone)!==phone)return false;
    if(!b.booking_time)return false;
    const start=new Date(`${b.booking_date}T${b.booking_time}`).getTime();
    return now.getTime()>=start-TOUR_BEFORE && now.getTime()<=start+TOUR_AFTER;
  });
  if(!matches.length)return{match:null,ambiguous:false};
  return{match:matches[0],ambiguous:matches.length>1};
}

async function getOrCreateThread({sessionType,sessionId,guestName,guestPhone,ghlContactId,ghlConvId,ambiguous}){
  if(sessionId){
    const col=sessionType==='hopper'?'hopper_request_id':'tour_booking_id';
    const{data:existing}=await supabaseAdmin.from('message_threads')
      .select('*').eq(col,sessionId).eq('status','active').order('created_at',{ascending:false}).limit(1);
    if(existing?.length){
      await supabaseAdmin.from('message_threads').update({
        last_message_at:new Date().toISOString(),
        ...(ghlContactId&&!existing[0].ghl_contact_id?{ghl_contact_id:ghlContactId}:{}),
        ...(ghlConvId&&!existing[0].ghl_conversation_id?{ghl_conversation_id:ghlConvId}:{}),
      }).eq('id',existing[0].id);
      return existing[0];
    }
  }
  const{data:thread,error}=await supabaseAdmin.from('message_threads').insert({
    session_type:sessionType,
    status:ambiguous?'unmatched':'active',
    guest_name:guestName,guest_phone:guestPhone,
    ghl_contact_id:ghlContactId||null,
    ghl_conversation_id:ghlConvId||null,
    matched_by:sessionType!=='support'?'phone':null,
    last_message_at:new Date().toISOString(),
    ...(sessionType==='hopper'?{hopper_request_id:sessionId}:{}),
    ...(sessionType==='guided_tour'?{tour_booking_id:sessionId}:{}),
  }).select().single();
  if(error)throw new Error('Thread create: '+error.message);
  return thread;
}

async function storeMessage({threadId,requestId,guestPhone,direction,sender,body,ghlMessageId}){
  const{error}=await supabaseAdmin.from('hopper_messages').insert({
    thread_id:threadId,request_id:requestId||null,guest_phone:guestPhone,
    direction,sender,body,ghl_message_id:ghlMessageId||null,
    delivery_status:direction==='outbound'?'sent':null,
  });
  if(error)console.error('[sms/inbound] store:',error.message);
}

async function ensureGHLContact(phone,name){
  const KEY=process.env.GHL_API_KEY;const LOC=process.env.GHL_LOCATION_ID;
  if(!KEY)return null;
  const H={'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Version':'2021-04-15'};
  try{
    const sr=await fetch(`https://services.leadconnectorhq.com/contacts/search?query=${encodeURIComponent(phone)}&locationId=${LOC}`,{headers:H});
    const sd=await sr.json();
    if(sd?.contacts?.[0]?.id)return sd.contacts[0].id;
    const cr=await fetch('https://services.leadconnectorhq.com/contacts/',{method:'POST',headers:H,body:JSON.stringify({locationId:LOC,phone,name:name||'Guest'})});
    return(await cr.json())?.contact?.id||null;
  }catch(e){console.error('[sms/inbound] GHL contact:',e.message);return null;}
}

async function sendGHL(contactId,convId,message){
  const KEY=process.env.GHL_API_KEY;const LOC=process.env.GHL_LOCATION_ID;
  if(!KEY||!contactId)return null;
  const H={'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Version':'2021-04-15'};
  try{
    const body={type:'SMS',contactId,locationId:LOC,message};
    if(convId)body.conversationId=convId;
    const r=await fetch('https://services.leadconnectorhq.com/conversations/messages',{method:'POST',headers:H,body:JSON.stringify(body)});
    return(await r.json())?.id||null;
  }catch(e){console.error('[sms/inbound] sendGHL:',e.message);return null;}
}

export async function POST(req){
  try{
    const{searchParams}=new URL(req.url);
    const secret=searchParams.get('secret');
    const expected=process.env.GHL_WEBHOOK_SECRET||process.env.OPS_PASSWORD;
    if(!expected||secret!==expected)return NextResponse.json({error:'Unauthorized'},{status:401});

    const payload=await req.json();
    const rawPhone=payload.phone||payload.from||payload.contactPhone;
    const msgBody=payload.body||payload.message||payload.text||'';
    const ghlContactId=payload.contactId||null;
    const ghlConvId=payload.conversationId||null;
    const ghlMessageId=payload.messageId||payload.id||null;
    const contactName=payload.contactName||payload.name||null;

    if(!rawPhone||!msgBody.trim())return NextResponse.json({ok:true,skipped:'no phone or body'});

    const e164=normalizePhone(rawPhone);
    if(!e164)return NextResponse.json({ok:true,skipped:'unparseable phone'});

    console.log(`[sms/inbound] From ${e164}: "${msgBody.slice(0,80)}"`);

    const contactId=ghlContactId||await ensureGHLContact(e164,contactName);
    const hopperResult=await matchHopper(e164);
    const tourResult=hopperResult.match?{match:null}:await matchTour(e164);

    let sessionType,sessionId,guestName,requestId,ambiguous=false;
    if(hopperResult.match){
      sessionType='hopper';sessionId=hopperResult.match.id;
      requestId=hopperResult.match.id;guestName=hopperResult.match.guest_name;
      ambiguous=hopperResult.ambiguous;
    }else if(tourResult.match){
      sessionType='guided_tour';sessionId=tourResult.match.id;
      requestId=null;guestName=tourResult.match.customer_name;
      ambiguous=tourResult.ambiguous;
    }else{
      sessionType='support';sessionId=null;requestId=null;guestName=contactName;
    }

    const thread=await getOrCreateThread({sessionType,sessionId,guestName,guestPhone:e164,ghlContactId:contactId,ghlConvId,ambiguous});
    await storeMessage({threadId:thread.id,requestId,guestPhone:e164,direction:'inbound',sender:guestName||e164,body:msgBody.trim(),ghlMessageId});

    if(sessionType==='support'){
      const autoMsg='Thanks for texting City Tour Guide! We received your message and will respond shortly. Once your driver is confirmed you can reply here anytime. For emergencies, call 911.';
      const replyId=await sendGHL(contactId,ghlConvId,autoMsg);
      if(replyId)await storeMessage({threadId:thread.id,requestId:null,guestPhone:e164,direction:'outbound',sender:'system',body:autoMsg,ghlMessageId:replyId});
      console.log(`[sms/inbound] Unmatched thread ${thread.id} for ${e164}`);
    }else{
      console.log(`[sms/inbound] Matched ${sessionType} ${sessionId} (ambiguous=${ambiguous})`);
    }

    return NextResponse.json({ok:true,threadId:thread.id,sessionType,matched:sessionType!=='support'});
  }catch(e){
    console.error('[sms/inbound]',e.message);
    return NextResponse.json({error:e.message},{status:500});
  }
}
