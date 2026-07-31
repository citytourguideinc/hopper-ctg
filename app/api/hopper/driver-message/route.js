export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const DRIVER_PIN = process.env.DRIVER_PIN;

export async function POST(req) {
  try {
    const pin = req.headers.get('x-driver-pin');
    if (pin !== DRIVER_PIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { requestId, message } = await req.json();
    if (!requestId || !message?.trim()) {
      return NextResponse.json({ error: 'requestId and message required' }, { status: 400 });
    }
    let thread;
    const { data: existing } = await supabaseAdmin
      .from('message_threads').select('*')
      .eq('hopper_request_id', requestId).eq('status','active')
      .order('created_at',{ascending:false}).limit(1);
    thread = existing?.[0] || null;
    if (!thread) {
      const { data: reqData } = await supabaseAdmin
        .from('hopper_requests').select('id,guest_name,guest_phone')
        .eq('id', requestId).single();
      if (!reqData) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      const { data: newThread } = await supabaseAdmin.from('message_threads').insert({
        session_type:'hopper', hopper_request_id:requestId,
        guest_name:reqData.guest_name, guest_phone:reqData.guest_phone||'',
        status:'active', matched_by:'request_id',
        last_message_at:new Date().toISOString(),
      }).select('*').single();
      thread = newThread;
    }
    if (!thread) return NextResponse.json({ error:'Could not create thread' },{ status:500 });
    await supabaseAdmin.from('hopper_messages').insert({
      thread_id:thread.id, request_id:requestId,
      guest_phone:thread.guest_phone||'', direction:'outbound',
      sender:'driver', body:message.trim(), delivery_status:'sent',
    });
    await supabaseAdmin.from('message_threads')
      .update({ last_message_at:new Date().toISOString() }).eq('id',thread.id);
    console.log('[driver-message] reply stored for ride', requestId.substring(0,8));
    return NextResponse.json({ ok:true, threadId:thread.id });
  } catch(e) {
    console.error('[driver-message]', e.message);
    return NextResponse.json({ error:e.message },{ status:500 });
  }
}
