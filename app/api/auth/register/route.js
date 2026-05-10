// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getUserByEmail, createUser } from '@/lib/db';
import { signToken, COOKIE_NAME_EXPORT } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function POST(request) {
  try {
    const rawBody = await request.json();
    const { name, email, password } = decryptRequest(rawBody);

    if (!name || !email || !password) {
      return NextResponse.json(encryptResponse({ error: 'All fields are required' }), { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(encryptResponse({ error: 'Password must be at least 6 characters' }), { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(encryptResponse({ error: 'Email already registered' }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    await createUser(newUser);

    // JWT token with ALL user details
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      addresses: newUser.addresses,
    };
    const token = signToken(tokenPayload);
    const { password: _, ...userPublic } = newUser;

    const response = NextResponse.json(encryptResponse({ user: userPublic, message: 'Registered successfully' }), { status: 201 });
    response.cookies.set(COOKIE_NAME_EXPORT, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(encryptResponse({ error: 'Internal server error' }), { status: 500 });
  }
}
