// app/api/categories/route.js
import { NextResponse } from 'next/server';
import { getCategories, createCategory, deleteCategory } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ categories: [], error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    const newCat = { id: uuidv4(), name, description: description || '' };
    await createCategory(newCat);
    return NextResponse.json({ category: newCat }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await request.json();
  try {
    await deleteCategory(id);
    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
