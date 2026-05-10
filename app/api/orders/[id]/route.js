// app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function GET(request, { params }) {
  // Require valid JWT token
  const auth = requireAuth(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const order = await getOrderById(id);
    if (!order) return NextResponse.json(encryptResponse({ error: 'Order not found' }), { status: 404 });

    if (auth.user.role !== 'admin' && order.userId !== auth.user.id) {
      return NextResponse.json(encryptResponse({ error: 'Forbidden' }), { status: 403 });
    }

    return NextResponse.json(encryptResponse({ order }));
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to fetch order' }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const rawBody = await request.json();
    const { status } = decryptRequest(rawBody);

    const order = await getOrderById(id);
    if (!order) return NextResponse.json(encryptResponse({ error: 'Order not found' }), { status: 404 });

    await updateOrderStatus(id, status);
    const updatedOrder = await getOrderById(id);
    return NextResponse.json(encryptResponse({ order: updatedOrder }));
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to update order' }), { status: 500 });
  }
}
