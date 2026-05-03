// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getOrders, saveOrders, getOrderById } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = verifyApiToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (user.role !== 'admin' && order.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PUT(request, { params }) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  return NextResponse.json({ order: orders[idx] });
}
