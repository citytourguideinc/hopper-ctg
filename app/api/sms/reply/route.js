export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

const OPS_PASS = process.env.OPS_PASSWORD;

async function sendGHL(contactId, convId, message) {
  const KEY = process.env.GHL_API_KEY;
  const LOC = process.env.GHL_LOCATION_ID || 'pY5diwHyCzufYtay5JaC';
  if (!KEY || !contactId) return null;
  const H = { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Version': '2021-04-15' };
  try {
    const body = { type: 'SMS', contactId, locationId: LOC, message };
    if (convId) body.conversationId = convId;
    const r = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST', headers: H, body: JSON.stringify(body),
    });
    const d = await r.json();
    return d?.id || null;
  } catch (e) {
    console.error('[sms/reply] GHL send error:', e.message);
    return null;
  }
}

export async function POST(req) {
  try {
    // Auth: accept ops cookie OR x-ops-password header
    const cookieStore = await cookies();
    const auth = cookieStore.get('hopper_ops_auth')?.value;
    const headerPass = req.headers.get('x-ops-password');
    if (auth !== '1' && headerPass !== OPS_PASS) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, threadId, message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });
    if (!requestId && !threadId) return NextResponse.json({ error: 'requestId or threadId required' }, { status: 400 });

    // Get thread (by ID or by hopper request)
    let thread;
    if (threadId) {
      const { data } = await supabaseAdmin.from('message_threads').select('*').eq('id', threadId).single();
      thread = data;
    } else {
      const { data } = await supabaseAdmin.from('message_threads')
        .select('*').eq('hopper_request_id', requestId).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1);
      thread = data?.[0] || null;
    }

    if (!thread) {
      return NextResponse.json({ error: 'No active thread found for this session' }, { status: 404 });
    }

    // Send via GHL
    const ghlMsgId = await sendGHL(thread.ghl_contact_id, thread.ghl_conversation_id, message.trim());

    // Store in hopper_messages
    const { error: storeErr } = await supabaseAdmin.from('hopper_messages').insert({
      thread_id:      thread.id,
      request_id:     thread.hopper_request_id || null,
      guest_phone:    thread.guest_phone,
      direction:      'outbound',
      sender:         'driver',
      body:           message.trim(),
      ghl_message_id: ghlMsgId || null,
      delivery_status: ghlMsgId ? 'sent' : 'failed',
    });
    if (storeErr) console.error('[sms/reply] store error:', storeErr.message);

    // Update thread last_message_at
    await supabaseAdmin.from('message_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', thread.id);

    console.log(`[sms/reply] Sent to ${thread.guest_phone} via GHL (msgId=${ghlMsgId})`);
    return NextResponse.json({ ok: true, ghlMsgId, threadId: thread.id });

  } catch (e) {
    console.error('[sms/reply]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
