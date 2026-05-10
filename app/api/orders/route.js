// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getOrders, getOrdersByUser, getProductById, reduceStock, getDiscountByCode, incrementDiscountUsage, createOrder, getUserById, updateUser } from '@/lib/db';
import { requireAuth, signToken, COOKIE_NAME_EXPORT } from '@/lib/auth';
import { encryptResponse, decryptRequest } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  // Require valid JWT token
  const auth = requireAuth(request);
  if (auth.response) return auth.response;

  try {
    if (auth.user.role === 'admin') {
      return NextResponse.json(encryptResponse({ orders: await getOrders() }));
    }
    return NextResponse.json(encryptResponse({ orders: await getOrdersByUser(auth.user.id) }));
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(encryptResponse({ orders: [], error: 'Failed to fetch orders' }), { status: 500 });
  }
}

export async function POST(request) {
  // Require valid JWT token
  const auth = requireAuth(request);
  if (auth.response) return auth.response;
  const user = auth.user;

  try {
    const rawBody = await request.json();
    const { items, shippingAddress, discountCode, paymentMethod } = decryptRequest(rawBody);

    if (!items || items.length === 0) {
      return NextResponse.json(encryptResponse({ error: 'Cart is empty' }), { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json(encryptResponse({ error: 'Shipping address is required' }), { status: 400 });
    }

    let subtotal = 0;
    const orderItems = [];

    // Validate stock and calculate totals
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json(encryptResponse({ error: `Product not found: ${item.productId}` }), { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(encryptResponse({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        }), { status: 400 });
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

    // Refresh JWT token on checkout with updated user details (new address, etc.)
    const updatedFullUser = await getUserById(user.id);
    const refreshedToken = signToken({
      id: updatedFullUser.id,
      email: updatedFullUser.email,
      name: updatedFullUser.name,
      role: updatedFullUser.role,
      addresses: updatedFullUser.addresses || [],
    });

    const response = NextResponse.json(encryptResponse({ order: newOrder }), { status: 201 });
    // Update the JWT cookie with latest user details after checkout
    response.cookies.set(COOKIE_NAME_EXPORT, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json(encryptResponse({ error: 'Failed to create order' }), { status: 500 });
  }
}
