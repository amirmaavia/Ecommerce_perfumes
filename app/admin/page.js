'use client';
// app/admin/page.js - Admin Dashboard
import { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/clientCrypto';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secureFetch('/api/admin/stats')
      .then(res => { setStats(res.data); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
      Loading dashboard...
    </div>
  );

  const statCards = [
    { icon: '💰', label: 'Total Revenue', value: `Rs. ${stats.totalRevenue?.toLocaleString()}`, color: 'var(--gold)' },
    { icon: '📦', label: 'Total Orders', value: stats.totalOrders, color: '#2196F3' },
    { icon: '⏳', label: 'Pending Orders', value: stats.pendingOrders, color: '#FF9800' },
    { icon: '🧴', label: 'Products', value: stats.totalProducts, color: '#9C27B0' },
    { icon: '⚠️', label: 'Low Stock', value: stats.lowStockProducts, color: '#E53935' },
    { icon: '👥', label: 'Customers', value: stats.totalUsers, color: '#4CAF50' },
  ];

  const statusStyle = s => ({ pending: 'status-pending', processing: 'status-processing', shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled' }[s] || 'status-pending');

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Revenue Chart (simplified) */}
        <div className="table-wrap" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Revenue (Last 7 Days)</h3>
          {stats?.last7Days?.map((d, i) => {
            const max = Math.max(...stats.last7Days.map(x => x.revenue), 1);
            const pct = (d.revenue / max) * 100;
            return (
              <div key={d.date} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>{new Date(d.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span style={{ color: 'var(--gold)' }}>Rs. {d.revenue.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--surface2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--gold-dark),var(--gold))', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Products */}
        <div className="table-wrap" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Top Selling Products</h3>
          {stats?.topProducts?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No sales data yet</p>
          ) : stats?.topProducts?.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px', background: 'var(--dark2)', borderRadius: '10px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', width: '24px' }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.quantity} units sold</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 700 }}>Rs. {p.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="table-wrap" style={{ marginTop: '24px' }}>
        <div className="table-header">
          <h3 style={{ fontSize: '1.1rem' }}>Recent Orders</h3>
          <a href="/admin/orders" className="btn btn-ghost btn-sm">View All →</a>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentOrders?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No orders yet</td></tr>
            ) : stats?.recentOrders?.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gold)' }}>{o.id.slice(0, 8).toUpperCase()}</td>
                <td>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>{o.userName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.userEmail}</div>
                </td>
                <td style={{ fontSize: '13px' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 700 }}>Rs. {o.total.toLocaleString()}</td>
                <td><span className={`status-badge ${statusStyle(o.status)}`}>{o.status}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
