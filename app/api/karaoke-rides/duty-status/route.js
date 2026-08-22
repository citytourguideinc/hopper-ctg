export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

const OPS_PASS = process.env.OPS_PASSWORD;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('karaoke_ride_duty')
      .select('is_on_duty, updated_at, updated_by')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { is_on_duty: false, updated_at: null },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      {
        is_on_duty: data.is_on_duty ?? false,
        updated_at: data.updated_at ?? null,
        updated_by: data.updated_by ?? null,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch {
    return NextResponse.json(
      { is_on_duty: false, updated_at: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export async function POST(req) {
  const headerPass = req.headers.get('x-ops-password');
  const cookieStore = await cookies();
  const cookieAuth = cookieStore.get('karaoke_rides_ops_auth')?.value;

  if (headerPass !== OPS_PASS && cookieAuth !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { is_on_duty, updated_by } = body;

  if (typeof is_on_duty !== 'boolean') {
    return NextResponse.json({ error: 'is_on_duty must be boolean' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('karaoke_ride_duty')
    .upsert({
      id: 1,
      is_on_duty,
      updated_at: new Date().toISOString(),
      updated_by: updated_by || 'driver',
    }, { onConflict: 'id' })
    .select('is_on_duty, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    is_on_duty: data.is_on_duty,
    updated_at: data.updated_at,
  });
}
