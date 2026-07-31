export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/hopper/waiver/lookup-by-phone?phone=<phone>
// Returns fields from the most recent signed waiver for a given phone number.
// Used by ctg-waiver sign.html to pre-populate returning guest fields.
// No sensitive data returned — only the submitter's own form fields.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get('phone') || '').replace(/\D/g, '');

  if (!raw || raw.length < 7) {
    return NextResponse.json({ found: false, reason: 'invalid_phone' });
  }

  // Match last 10 digits to handle +1 prefix variations
  const last10 = raw.slice(-10);

  const { data, error } = await supabaseAdmin
    .from('hopper_waivers')
    .select('guest_name, guest_phone, dob, email, address, city, state, zip, signed_at')
    .not('signed_at', 'is', null)
    .ilike('guest_phone', `%${last10}`)
    .order('signed_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    data: {
      print_name: data.guest_name || '',
      dob:        data.dob        || '',
      email:      data.email      || '',
      address:    data.address    || '',
      city:       data.city       || '',
      state:      data.state      || '',
      zip:        data.zip        || '',
    },
  });
}
