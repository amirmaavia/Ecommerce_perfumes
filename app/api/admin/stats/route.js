// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { getOrders, getProducts, getUsers } from '@/lib/db';
import { verifyApiToken } from '@/lib/auth';

export async function GET(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const orders = await getOrders();
    const products = await getProducts();
    const users = await getUsers();

    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;
    const totalUsers = users.filter(u => u.role !== 'admin').length;

    // Revenue by day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayRevenue = orders
        .filter(o => o.createdAt && String(o.createdAt).startsWith(dayStr) && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);
      last7Days.push({ date: dayStr, revenue: dayRevenue });
    }

    // Top products
    const productSales = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      totalUsers,
      last7Days,
      topProducts,
      recentOrders: orders.slice(0, 5),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
