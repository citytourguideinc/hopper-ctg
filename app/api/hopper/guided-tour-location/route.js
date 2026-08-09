export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validGuidedTourSession } from '@/lib/guidedTourAuth';

export async function GET() {
  const store = await cookies();
  const token = store.get('ctg_guided_tour_auth')?.value;

  if (!validGuidedTourSession(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      'https://hopper-ctg.vercel.app/api/hopper/driver-location',
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (!response.ok || !data.available) {
      return NextResponse.json({
        available: false
      });
    }

    return NextResponse.json({
      available: true,
      lat: data.lat,
      lng: data.lng,
      updated_at: data.updated_at
    });

  } catch {
    return NextResponse.json({
      available: false
    });
  }
}
