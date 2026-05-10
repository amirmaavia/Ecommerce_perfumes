// lib/auth.js - Authentication utilities with JWT and Admin verification
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'luxe-perfume-secret-key-2024-very-secure';
const COOKIE_NAME = 'auth_token';

/**
 * Sign a JWT token with full user details
 * Token contains: id, email, name, role, addresses
 * @param {Object} payload - User details to encode
 * @returns {string} - Signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      addresses: payload.addresses || [],
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token string
 * @returns {Object|null} - Decoded user payload or null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user from cookies (server components)
 * @returns {Object|null} - User payload or null
 */
export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Verify JWT from API request (Authorization header or cookies)
 * Used for all API route protection
 * @param {Request} request - The incoming request
 * @returns {Object|null} - Decoded user or null
 */
export function verifyApiToken(request) {
  try {
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      return verifyToken(token);
    }
    // Fallback to cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      if (match) return verifyToken(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Middleware to verify admin access on API routes
 * Returns the user object if admin, or a 403 Response
 * @param {Request} request - The incoming request
 * @returns {{ user: Object } | { response: Response }}
 */
export function requireAdmin(request) {
  const user = verifyApiToken(request);
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: 'Unauthorized - Valid JWT token required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  if (user.role !== 'admin') {
    return {
      response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}

/**
 * Middleware to verify authenticated user on API routes
 * Returns the user object if authenticated, or a 401 Response
 * @param {Request} request - The incoming request
 * @returns {{ user: Object } | { response: Response }}
 */
export function requireAuth(request) {
  const user = verifyApiToken(request);
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: 'Unauthorized - Valid JWT token required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
