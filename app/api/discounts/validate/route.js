// app/api/discounts/validate/route.js
import { NextResponse } from 'next/server';
import { getDiscountByCode } from '@/lib/db';
import { encryptResponse, decryptRequest } from '@/lib/crypto';

export async function POST(request) {
  const rawBody = await request.json();
  const { code, orderTotal } = decryptRequest(rawBody);
  if (!code) return NextResponse.json(encryptResponse({ error: 'Code required' }), { status: 400 });

  const discount = await getDiscountByCode(code.toUpperCase());
  if (!discount) {
    return NextResponse.json(encryptResponse({ error: 'Invalid or expired discount code' }), { status: 404 });
  }

  if (discount.minOrder && orderTotal < discount.minOrder) {
    return NextResponse.json(encryptResponse({
      error: `Minimum order of Rs. ${discount.minOrder} required for this code`
    }), { status: 400 });
  }

  if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
    return NextResponse.json(encryptResponse({ error: 'Discount code usage limit reached' }), { status: 400 });
  }

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (orderTotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, orderTotal);
  }

  return NextResponse.json(encryptResponse({ discount, discountAmount: Math.round(discountAmount) }));
}
