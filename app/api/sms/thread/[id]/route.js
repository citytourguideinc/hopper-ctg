export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

const OPS_PASS = process.env.OPS_PASSWORD;

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const auth       = cookieStore.get('hopper_ops_auth')?.value;
    const headerPass = req.headers.get('x-ops-password');
    const isOps      = auth === '1' || headerPass === OPS_PASS;
    let thread = null;
    const { data: byThread } = await supabaseAdmin.from('message_threads').select('*').eq('id', id).single();
    if (byThread) { thread = byThread; } else {
      const { data: byReq } = await supabaseAdmin.from('message_threads')
        .select('*').eq('hopper_request_id', id).eq('status','active')
        .order('created_at',{ascending:false}).limit(1);
      thread = byReq?.[0] || null;
    }
    // Guest access: valid hopper_request_id is the auth token
    if (!isOps) {
      if (!thread) {
        const { data: reqCheck } = await supabaseAdmin.from('hopper_requests').select('id').eq('id', id).single();
        if (!reqCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ thread: null, messages: [] });
      }
      if (thread.hopper_request_id !== id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!thread) return NextResponse.json({ thread: null, messages: [] });
    const { data: messages } = await supabaseAdmin.from('hopper_messages')
      .select('id,direction,sender,body,sent_at,delivery_status')
      .eq('thread_id', thread.id).order('sent_at',{ascending:true});
    return NextResponse.json({ thread, messages: messages || [] });
  } catch(e) {
    console.error('[sms/thread]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
