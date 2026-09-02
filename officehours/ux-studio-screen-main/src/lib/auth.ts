import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'office-hours-session';

function password() {
  return process.env.OFFICE_HOURS_PASSWORD;
}

export function isPasswordValid(value: string) {
  const expected = password();
  if (!expected) return false;

  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createSessionToken() {
  const secret = password();
  if (!secret) return '';
  return createHmac('sha256', secret).update('office-hours-authenticated').digest('base64url');
}

export function hasValidSession(value?: string) {
  const token = createSessionToken();
  if (!value || !token) return false;
  const valueBuffer = Buffer.from(value);
  const tokenBuffer = Buffer.from(token);
  return valueBuffer.length === tokenBuffer.length && timingSafeEqual(valueBuffer, tokenBuffer);
}

export { SESSION_COOKIE };
