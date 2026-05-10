// app/api/discounts/route.js
import { NextResponse } from 'next/server';
import { getDiscounts, getDiscountByCode, createDiscount } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    return NextResponse.json(encryptResponse({ discounts: await getDiscounts() }));
  } catch (error) {
    console.error('Discounts GET error:', error);
    return NextResponse.json(encryptResponse({ discounts: [], error: 'Failed to fetch discounts' }), { status: 500 });
  }
}

export async function POST(request) {
  // Require valid JWT admin token
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const rawBody = await request.json();
  const { code, type, value, minOrder, maxUses, active } = decryptRequest(rawBody);
  if (!code || !type || !value) {
    return NextResponse.json(encryptResponse({ error: 'Code, type and value are required' }), { status: 400 });
  }

  try {
    const existing = await getDiscountByCode(code);
    if (existing) {
      return NextResponse.json(encryptResponse({ error: 'Discount code already exists' }), { status: 409 });
    }

    const newDiscount = {
      id: uuidv4(),
      code: code.toUpperCase(),
      type, // 'percentage' | 'fixed'
      value: parseFloat(value),
      minOrder: parseFloat(minOrder || 0),
      maxUses: parseInt(maxUses || 0),
      usedCount: 0,
      active: active !== false,
    };

    await createDiscount(newDiscount);
    return NextResponse.json(encryptResponse({ discount: newDiscount }), { status: 201 });
  } catch (error) {
    console.error('Discounts POST error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to create discount' }), { status: 500 });
  }
}
