
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

const OPS_PASS = process.env.OPS_PASSWORD;

export async function POST(req) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('hopper_ops_auth')?.value;
  const body = await req.json();
  const { action, id, eta, declineReason, password, message, driverName } = body;

  // Login
  if (action === 'login') {
    if (password !== OPS_PASS) return NextResponse.json({ error:'Wrong password' },{ status:401 });
    const res = NextResponse.json({ ok:true });
    res.cookies.set('hopper_ops_auth','1',{ httpOnly:true, maxAge:86400*7, path:'/' });
    return res;
  }

  // Accept both cookie auth and x-ops-password header (driver uses header; ops dashboard uses cookie)
  const headerPass = req.headers.get('x-ops-password');
  if (auth !== '1' && headerPass !== OPS_PASS) return NextResponse.json({ error:'Unauthorized' },{ status:401 });

  if (action === 'accept') {
    // Create waivers for each guest
    const { data: req2 } = await supabaseAdmin.from('hopper_requests').select('guest_count,guest_name,guest_phone').eq('id',id).single();
    const count = req2?.guest_count||1;
    // Only create waivers if none exist yet for this request
    const { data: existingW } = await supabaseAdmin.from('hopper_waivers').select('id').eq('request_id',id).limit(1);
    if (!existingW || existingW.length === 0) {
      const waivers = Array.from({length:count},(_,i)=>({
        request_id: id,
        token: crypto.randomUUID(), // proper UUID
        guest_index: i+1,
        guest_name: i===0 ? req2?.guest_name : null,
        guest_phone: i===0 ? req2?.guest_phone : null,
      }));
      const { error: wErr } = await supabaseAdmin.from('hopper_waivers').insert(waivers);
      if (wErr) console.error('[ops accept] waiver insert error:', wErr.message);
    }
    await supabaseAdmin.from('hopper_requests').update({ status:'confirmed', eta_minutes:eta||15 }).eq('id',id);
    await supabaseAdmin.from('hopper_events').insert({ request_id:id, event_type:'confirm' });
    return NextResponse.json({ ok:true, waivers });
  }

  if (action === 'decline') {
    await supabaseAdmin.from('hopper_requests').update({ status:'declined', decline_reason:declineReason||'Driver unavailable' }).eq('id',id);
    await supabaseAdmin.from('hopper_events').insert({ request_id:id, event_type:'decline' });
    return NextResponse.json({ ok:true });
  }

  if (action === 'start') {
    await supabaseAdmin.from('hopper_requests').update({ status:'ride_active', started_at: new Date().toISOString() }).eq('id',id);
    await supabaseAdmin.from('hopper_events').insert({ request_id:id, event_type:'start' });
    return NextResponse.json({ ok:true });
  }

  if (action === 'complete') {
    await supabaseAdmin.from('hopper_requests').update({ status:'completed', completed_at: new Date().toISOString() }).eq('id',id);
    await supabaseAdmin.from('hopper_events').insert({ request_id:id, event_type:'complete' });
    return NextResponse.json({ ok:true });
  }


  if (action === 'sms') {
    if (!id) return NextResponse.json({ error: 'Missing request id' }, { status: 400 });
    const { data: reqData } = await supabaseAdmin.from('hopper_requests').select('guest_phone,guest_name').eq('id',id).single();
    if (!reqData)           return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    const toPhone = reqData?.guest_phone;
    if (!toPhone)           return NextResponse.json({ error: 'No guest phone on this request' }, { status: 422 });
    const GHL_KEY = process.env.GHL_API_KEY;
    if (!GHL_KEY)           return NextResponse.json({ error: 'SMS service not configured' }, { status: 503 });
    const GHL_LOC = process.env.GHL_LOCATION_ID || 'pY5diwHyCzufYtay5JaC';
    try {
      const GHL_H = { 'Authorization': 'Bearer '+GHL_KEY, 'Content-Type': 'application/json', 'Version': '2021-04-15' };
      // 1. Find or create GHL contact
      const sr = await fetch('https://services.leadconnectorhq.com/contacts/?locationId='+GHL_LOC+'&query='+encodeURIComponent(toPhone),{headers:GHL_H});
      if (!sr.ok) { console.error('[GHL SMS] Contact search failed:', sr.status); return NextResponse.json({ error: 'GHL contact search failed' }, { status: 502 }); }
      const sd = await sr.json();
      let cId = sd?.contacts?.[0]?.id;
      if (!cId) {
        const cr = await fetch('https://services.leadconnectorhq.com/contacts/',{method:'POST',headers:GHL_H,body:JSON.stringify({locationId:GHL_LOC,phone:toPhone,name:reqData?.guest_name||'Guest'})});
        if (!cr.ok) { console.error('[GHL SMS] Contact create failed:', cr.status); return NextResponse.json({ error: 'GHL contact create failed' }, { status: 502 }); }
        cId = (await cr.json())?.contact?.id;
      }
      if (!cId) return NextResponse.json({ error: 'Could not resolve GHL contact' }, { status: 502 });
      // 2. Send SMS â€” prepend Guest + Driver attribution, then message body
      const guestLabel  = reqData.guest_name ? `Guest: ${reqData.guest_name}` : null;
      const driverLabel = driverName         ? `Driver: ${driverName}`        : null;
      const prefix = [guestLabel, driverLabel].filter(Boolean).join('\n');
      const msgBody = message || 'Message from City Hopper';
      const msg = prefix ? `${prefix}\n${msgBody}` : msgBody;
      const mr = await fetch('https://services.leadconnectorhq.com/conversations/messages',{method:'POST',headers:GHL_H,body:JSON.stringify({type:'SMS',contactId:cId,locationId:GHL_LOC,message:msg})});
      if (!mr.ok) {
        const mErr = await mr.text().catch(()=>'');
        console.error('[GHL SMS] Message send failed:', mr.status, mErr.slice(0,200));
        return NextResponse.json({ error: 'GHL message send failed ('+mr.status+')' }, { status: 502 });
      }
      return NextResponse.json({ ok: true });
    } catch(e) { console.error('[GHL SMS] Error:', e.message); return NextResponse.json({ error: e.message },{ status:500 }); }
  }

  if (action === 'reorder') {
    // Store queue order in hopper_requests via queue_position
    const { order } = body;
    for (let i=0;i<order.length;i++) {
      await supabaseAdmin.from('hopper_requests').update({ queue_position: i+1 }).eq('id',order[i]);
    }
    return NextResponse.json({ ok:true });
  }

  return NextResponse.json({ error:'Unknown action' },{ status:400 });
}

export async function GET(req) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('hopper_ops_auth')?.value;
  const headerPass = req.headers.get('x-ops-password');
  if (auth !== '1' && headerPass !== OPS_PASS) return NextResponse.json({ error:'Unauthorized' },{ status:401 });
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from('hopper_requests')
    .select('*, hopper_waivers(id,token,signed_at,guest_name,guest_index,guest_phone,waiver_type,minors)')
    .or(
      'status.in.(pending,pending_waivers,confirmed,pickup_started,driver_arrived,ride_active,waivers_complete),' +
      'and(status.in.(completed,declined,canceled),created_at.gte.' + cutoff30d + ')'
    )
    .order('created_at',{ ascending:false })
    .limit(100);
  return NextResponse.json({ requests: data||[] });
}

export async function PATCH(req) {
  const headerPass = req.headers.get('x-ops-password');
  const cookieStore = await cookies();
  const auth = cookieStore.get('hopper_ops_auth')?.value;
  if (auth !== '1' && headerPass !== OPS_PASS) return NextResponse.json({ error:'Unauthorized' },{ status:401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error:'Missing id or status' },{ status:400 });

  const statusMap = {
    confirmed:      { status:'confirmed',      eta_minutes:15 },
    declined:       { status:'declined',       decline_reason:'Driver unavailable' },
    pickup_started: { status:'pickup_started' },
    driver_arrived: { status:'driver_arrived' },
    ride_active:    { status:'ride_active',    started_at: new Date().toISOString() },
    completed:      { status:'completed',      completed_at: new Date().toISOString() },
  };

  const update = statusMap[status];
  if (!update) return NextResponse.json({ error:'Unknown status' },{ status:400 });

  // Try full update first; fall back to status-only if columns missing
  const { error: updateErr } = await supabaseAdmin
    .from('hopper_requests').update(update).eq('id', id);
  if (updateErr) {
    console.warn('[ops PATCH] full update failed, trying status-only:', updateErr.message);
    const { error: fallbackErr } = await supabaseAdmin
      .from('hopper_requests').update({ status: update.status }).eq('id', id);
    if (fallbackErr) {
      return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
    }
  }
  await supabaseAdmin.from('hopper_events')
    .insert({ request_id:id, event_type: status })
    .then(() => {}).catch(() => {});
  return NextResponse.json({ ok:true });
}
