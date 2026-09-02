import { NextResponse } from 'next/server';
import { createSessionToken, isPasswordValid, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const submittedPassword = String(formData.get('password') ?? '');

  if (!isPasswordValid(submittedPassword)) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
