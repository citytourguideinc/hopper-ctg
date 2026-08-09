import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  guidedTourSessionToken,
  validGuidedTourCode,
  validGuidedTourSession
} from '@/lib/guidedTourAuth';

const COOKIE = 'ctg_guided_tour_auth';

export async function GET() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  return NextResponse.json({
    ok: validGuidedTourSession(token)
  });
}

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!validGuidedTourCode(code)) {
      return NextResponse.json(
        { error: 'Incorrect access code' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(
      COOKIE,
      guidedTourSessionToken(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/'
      }
    );

    return response;

  } catch {
    return NextResponse.json(
      { error: 'Unable to verify access code' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(
    COOKIE,
    '',
    {
      httpOnly: true,
      maxAge: 0,
      path: '/'
    }
  );

  return response;
}
