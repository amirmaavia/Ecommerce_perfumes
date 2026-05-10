// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { COOKIE_NAME_EXPORT } from '@/lib/auth';
import { encryptResponse } from '@/lib/crypto';

export async function POST() {
  const response = NextResponse.json(encryptResponse({ message: 'Logged out successfully' }));
  response.cookies.set(COOKIE_NAME_EXPORT, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
