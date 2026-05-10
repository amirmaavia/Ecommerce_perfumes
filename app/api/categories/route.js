// app/api/categories/route.js
import { NextResponse } from 'next/server';
import { getCategories, createCategory, deleteCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(encryptResponse({ categories }));
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(encryptResponse({ categories: [], error: 'Failed to fetch categories' }), { status: 500 });
  }
}

export async function POST(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const rawBody = await request.json();
  const { name, description } = decryptRequest(rawBody);
  if (!name) return NextResponse.json(encryptResponse({ error: 'Name is required' }), { status: 400 });

  try {
    const newCat = { id: uuidv4(), name, description: description || '' };
    await createCategory(newCat);
    return NextResponse.json(encryptResponse({ category: newCat }), { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to create category' }), { status: 500 });
  }
}

export async function DELETE(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const rawBody = await request.json();
  const { id } = decryptRequest(rawBody);
  try {
    await deleteCategory(id);
    return NextResponse.json(encryptResponse({ message: 'Category deleted' }));
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to delete category' }), { status: 500 });
  }
}
