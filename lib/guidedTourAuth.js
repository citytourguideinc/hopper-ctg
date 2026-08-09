import { createHmac, timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export function validGuidedTourCode(code) {
  const expected = process.env.GUIDED_TOUR_ACCESS_CODE;

  if (!expected) return false;

  return safeEqual(code, expected);
}

export function guidedTourSessionToken() {
  const secret = process.env.GUIDED_TOUR_SESSION_SECRET;

  if (!secret) return '';

  return createHmac('sha256', secret)
    .update('ctg-guided-tour-session-v1')
    .digest('hex');
}

export function validGuidedTourSession(token) {
  const expected = guidedTourSessionToken();

  if (!expected || !token) return false;

  return safeEqual(token, expected);
}
