// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const fullUser = await getUserById(user.id);
    if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { password, ...userPublic } = fullUser;
    return NextResponse.json({ user: userPublic });
  } catch (error) {
    console.error('Me GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
