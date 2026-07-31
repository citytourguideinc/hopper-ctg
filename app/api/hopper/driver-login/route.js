import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const expectedPin = process.env.DRIVER_PIN;

    if (!expectedPin) {
      return NextResponse.json(
        { error: 'Driver authentication is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const submittedPin = String(body?.pin || '');

    if (!submittedPin || submittedPin !== expectedPin) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Unable to verify PIN' },
      { status: 400 }
    );
  }
}
