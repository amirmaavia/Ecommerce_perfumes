// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { signToken, COOKIE_NAME_EXPORT } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function POST(request) {
  try {
    const rawBody = await request.json();
    const { email, password } = decryptRequest(rawBody);

    if (!email || !password) {
      return NextResponse.json(encryptResponse({ error: 'Email and password are required' }), { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(encryptResponse({ error: 'Invalid credentials' }), { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(encryptResponse({ error: 'Invalid credentials' }), { status: 401 });
    }

    // JWT token with ALL user details
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      addresses: user.addresses || [],
    };
    const token = signToken(tokenPayload);
    const { password: _, ...userPublic } = user;

    const response = NextResponse.json(encryptResponse({ user: userPublic, message: 'Login successful' }));
    response.cookies.set(COOKIE_NAME_EXPORT, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(encryptResponse({ error: 'Internal server error' }), { status: 500 });
  }
}
