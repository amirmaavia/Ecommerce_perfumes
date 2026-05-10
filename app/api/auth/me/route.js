// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { encryptResponse } from '@/lib/crypto';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user) return NextResponse.json(encryptResponse({ error: 'Unauthorized' }), { status: 401 });

  try {
    const fullUser = await getUserById(user.id);
    if (!fullUser) return NextResponse.json(encryptResponse({ error: 'User not found' }), { status: 404 });

    const { password, ...userPublic } = fullUser;
    return NextResponse.json(encryptResponse({ user: userPublic }));
  } catch (error) {
    console.error('Me GET error:', error);
    return NextResponse.json(encryptResponse({ error: 'Internal server error' }), { status: 500 });
  }
}
