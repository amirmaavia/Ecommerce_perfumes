// app/api/products/[id]/route.js
import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) return NextResponse.json(encryptResponse({ error: 'Product not found' }), { status: 404 });
    return NextResponse.json(encryptResponse({ product }));
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to fetch product' }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const rawBody = await request.json();
    const body = decryptRequest(rawBody);
    const updated = await updateProduct(id, body);
    if (!updated) return NextResponse.json(encryptResponse({ error: 'Product not found' }), { status: 404 });
    return NextResponse.json(encryptResponse({ product: updated }));
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to update product' }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const deleted = await deleteProduct(id);
    if (!deleted) return NextResponse.json(encryptResponse({ error: 'Product not found' }), { status: 404 });
    return NextResponse.json(encryptResponse({ message: 'Product deleted' }));
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to delete product' }), { status: 500 });
  }
}
