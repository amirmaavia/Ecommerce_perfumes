// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getUsers, getUserById, updateUser } from '@/lib/db';
import pool from '@/lib/mysql';
import { verifyApiToken } from '@/lib/auth';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const users = await getUsers();
    // Return users without passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ users: [], error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id, role } = await request.json();
  if (!id || !role) {
    return NextResponse.json({ error: 'ID and role required' }, { status: 400 });
  }

  try {
    const targetUser = await getUserById(id);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Prevent removing own admin role
    if (targetUser.id === user.id && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updatedUser = await getUserById(id);
    const { password, ...safeUser } = updatedUser;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  try {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
