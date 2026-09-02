import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSession, SESSION_COOKIE } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (hasValidSession(session)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!login|api/auth/login|_next/static|_next/image|icon.png).*)'],
};
