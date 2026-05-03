// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getOrders, getOrdersByUser, getProductById, reduceStock, getDiscountByCode, incrementDiscountUsage, createOrder, getUserById, updateUser } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    if (user.role === 'admin') {
      return NextResponse.json({ orders: await getOrders() });
    }
    return NextResponse.json({ orders: await getOrdersByUser(user.id) });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ orders: [], error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyApiToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { items, shippingAddress, discountCode, paymentMethod } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    let subtotal = 0;
    const orderItems = [];

    // Validate stock and calculate totals
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        }, { status: 400 });
      }
      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    // Apply discount
    let discountAmount = 0;
    let appliedDiscount = null;
    if (discountCode) {
      const discount = await getDiscountByCode(discountCode);
      if (discount) {
        if (discount.type === 'percentage') {
          discountAmount = Math.round((subtotal * discount.value) / 100);
        } else {
          discountAmount = Math.min(discount.value, subtotal);
        }
        appliedDiscount = discount.code;
        await incrementDiscountUsage(discount.code);
      }
    }

    const shipping = subtotal > 5000 ? 0 : 199;
    const total = subtotal - discountAmount + shipping;

    // Reduce stock automatically
    for (const item of items) {
      await reduceStock(item.productId, item.quantity);
    }

    // Create order
    const newOrder = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: orderItems,
      shippingAddress,
      subtotal,
      discountAmount,
      appliedDiscount,
      shipping,
      total,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
    };

    await createOrder(newOrder);

    // Save address to user profile
    const fullUser = await getUserById(user.id);
    if (fullUser) {
      const addresses = fullUser.addresses || [];
      const existingAddr = addresses.find(a =>
        a.street === shippingAddress.street && a.city === shippingAddress.city
      );
      if (!existingAddr) {
        addresses.push({ ...shippingAddress, id: uuidv4() });
        await updateUser(user.id, { addresses });
      }
    }

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
