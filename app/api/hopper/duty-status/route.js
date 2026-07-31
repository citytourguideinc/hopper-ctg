export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

const OPS_PASS = process.env.OPS_PASSWORD;

// GET â€” public, no auth required
// Landing page polls this to know whether City Hopper is live
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('hopper_duty')
      .select('is_on_duty, updated_at, updated_by')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Table may not exist yet â€” safe fallback
      return NextResponse.json(
        { is_on_duty: false, updated_at: null },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
    return NextResponse.json(
      { is_on_duty: data.is_on_duty ?? false, updated_at: data.updated_at ?? null, updated_by: data.updated_by ?? null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { is_on_duty: false, updated_at: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

// POST â€” protected (same auth as ops route)
// Body: { is_on_duty: boolean }
export async function POST(req) {
  // Auth: x-ops-password header OR hopper_ops_auth cookie
  const headerPass   = req.headers.get('x-ops-password');
  const cookieStore  = await cookies();
  const cookieAuth   = cookieStore.get('hopper_ops_auth')?.value;
  if (headerPass !== OPS_PASS && cookieAuth !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { is_on_duty, updated_by } = body;
  if (typeof is_on_duty !== 'boolean') {
    return NextResponse.json({ error: 'is_on_duty must be boolean' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('hopper_duty')
    .upsert({
      id:         1,
      is_on_duty,
      updated_at: new Date().toISOString(),
      updated_by: updated_by || 'driver',
    }, { onConflict: 'id' })
    .select('is_on_duty, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, is_on_duty: data.is_on_duty, updated_at: data.updated_at });
}

