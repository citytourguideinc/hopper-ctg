export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { requestId, message } = await req.json();
    if (!requestId || !message?.trim()) {
      return NextResponse.json({ error: 'requestId and message required' }, { status: 400 });
    }
    // Validate request exists and is active
    const { data: reqData } = await supabaseAdmin.from('hopper_requests')
      .select('id,guest_name,guest_phone,status').eq('id', requestId).single();
    if (!reqData) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    const blocked = ['completed','declined','cancelled','canceled'];
    if (blocked.includes(reqData.status)) {
      return NextResponse.json({ error: 'Session is closed' }, { status: 403 });
    }
    // Find or create thread
    let thread;
    const { data: existing } = await supabaseAdmin.from('message_threads')
      .select('*').eq('hopper_request_id', requestId).eq('status','active')
      .order('created_at',{ascending:false}).limit(1);
    thread = existing?.[0] || null;
    if (!thread) {
      const guestName  = reqData.guest_name || 'Guest';
      const guestPhone = reqData.guest_phone || '';
      const { data: newThread } = await supabaseAdmin.from('message_threads').insert({
        session_type: 'hopper', hopper_request_id: requestId,
        guest_name: guestName, guest_phone: guestPhone,
        status: 'active', matched_by: 'request_id',
        last_message_at: new Date().toISOString(),
      }).select('*').single();
      thread = newThread;
    }
    if (!thread) return NextResponse.json({ error: 'Could not create thread' }, { status: 500 });
    // Store inbound guest message
    const firstName = (reqData.guest_name || 'Guest').split(' ')[0];
    await supabaseAdmin.from('hopper_messages').insert({
      thread_id:       thread.id,
      request_id:      requestId,
      guest_phone:     reqData.guest_phone || '',
      direction:       'inbound',
      sender:          firstName,
      body:            message.trim(),
      delivery_status: 'received',
    });
    await supabaseAdmin.from('message_threads')
      .update({ last_message_at: new Date().toISOString() }).eq('id', thread.id);
    console.log('[guest-message] stored from', firstName, 'on ride', requestId.substring(0,8));
    return NextResponse.json({ ok: true, threadId: thread.id });
  } catch(e) {
    console.error('[guest-message]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}