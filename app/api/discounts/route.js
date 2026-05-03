// app/api/discounts/route.js
import { NextResponse } from 'next/server';
import { getDiscounts, getDiscountByCode, createDiscount } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  try {
    return NextResponse.json({ discounts: await getDiscounts() });
  } catch (error) {
    console.error('Discounts GET error:', error);
    return NextResponse.json({ discounts: [], error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { code, type, value, minOrder, maxUses, active } = await request.json();
  if (!code || !type || !value) {
    return NextResponse.json({ error: 'Code, type and value are required' }, { status: 400 });
  }

  try {
    const existing = await getDiscountByCode(code);
    if (existing) {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 409 });
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
    return NextResponse.json({ discount: newDiscount }, { status: 201 });
  } catch (error) {
    console.error('Discounts POST error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
