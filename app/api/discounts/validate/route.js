// app/api/discounts/validate/route.js
import { NextResponse } from 'next/server';
import { getDiscountByCode } from '@/lib/db';

export async function POST(request) {
  const { code, orderTotal } = await request.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const discount = getDiscountByCode(code.toUpperCase());
  if (!discount) {
    return NextResponse.json({ error: 'Invalid or expired discount code' }, { status: 404 });
  }

  if (discount.minOrder && orderTotal < discount.minOrder) {
    return NextResponse.json({
      error: `Minimum order of Rs. ${discount.minOrder} required for this code`
    }, { status: 400 });
  }

  if (discount.maxUses > 0 && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 });
  }

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (orderTotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, orderTotal);
  }

  return NextResponse.json({ discount, discountAmount: Math.round(discountAmount) });
}
