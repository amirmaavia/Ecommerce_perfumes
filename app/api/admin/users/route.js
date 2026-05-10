// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getUsers, getUserById, updateUser } from '@/lib/db';
import pool from '@/lib/mysql';
import { requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function GET(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const users = await getUsers();
    // Return users without passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json(encryptResponse({ users: safeUsers }));
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(encryptResponse({ users: [], error: 'Failed to fetch users' }), { status: 500 });
  }
}

export async function PUT(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const rawBody = await request.json();
  const { id, role } = decryptRequest(rawBody);
  if (!id || !role) {
    return NextResponse.json(encryptResponse({ error: 'ID and role required' }), { status: 400 });
  }

  try {
    const targetUser = await getUserById(id);
    if (!targetUser) return NextResponse.json(encryptResponse({ error: 'User not found' }), { status: 404 });

    // Prevent removing own admin role
    if (targetUser.id === auth.user.id && role !== 'admin') {
      return NextResponse.json(encryptResponse({ error: 'Cannot change your own role' }), { status: 400 });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updatedUser = await getUserById(id);
    const { password, ...safeUser } = updatedUser;
    return NextResponse.json(encryptResponse({ user: safeUser }));
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to update user' }), { status: 500 });
  }
}

export async function DELETE(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const rawBody = await request.json();
  const { id } = decryptRequest(rawBody);
  if (!id) return NextResponse.json(encryptResponse({ error: 'ID required' }), { status: 400 });

  if (id === auth.user.id) {
    return NextResponse.json(encryptResponse({ error: 'Cannot delete your own account' }), { status: 400 });
  }

  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json(encryptResponse({ error: 'User not found' }), { status: 404 });
    }
    return NextResponse.json(encryptResponse({ message: 'User deleted' }));
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to delete user' }), { status: 500 });
  }
}
