// app/api/products/route.js
import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    category: searchParams.get('category') || undefined,
    gender: searchParams.get('gender') || undefined,
    search: searchParams.get('search') || undefined,
    featured: searchParams.get('featured') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    minRating: searchParams.get('minRating') || undefined,
    size: searchParams.get('size') || undefined,
    inStock: searchParams.get('inStock') || undefined,
  };

  try {
    const products = await getProducts(filters);
    return NextResponse.json(encryptResponse({ products }));
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(encryptResponse({ products: [], error: 'Failed to fetch products' }), { status: 500 });
  }
}

export async function POST(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const rawBody = await request.json();
    const body = decryptRequest(rawBody);
    const { name, category, price, originalPrice, stock, description, notes, size, gender, featured, image, images } = body;

    if (!name || !price || !stock) {
      return NextResponse.json(encryptResponse({ error: 'Name, price and stock are required' }), { status: 400 });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      category: category || 'cat1',
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice || price),
      stock: parseInt(stock),
      description: description || '',
      notes: notes || { top: '', heart: '', base: '' },
      size: size || '100ml',
      gender: gender || 'unisex',
      featured: featured || false,
      image: image || '/images/perfume1.jpg',
      images: images && images.length > 0 ? images : [image || '/images/perfume1.jpg'],
      rating: 0,
      reviews: 0,
    };

    await createProduct(newProduct);
    return NextResponse.json(encryptResponse({ product: newProduct }), { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to create product' }), { status: 500 });
  }
}
