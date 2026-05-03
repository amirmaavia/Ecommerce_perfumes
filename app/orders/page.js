'use client';
// app/orders/page.js - User Order History
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const newOrderId = searchParams.get('new');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      fetch('/api/orders')
        .then(r => r.json())
        .then(d => { setOrders(d.orders || []); setLoading(false); });
    }
  }, [user, authLoading]);

  const statusStyle = (status) => {
    const map = {
      pending: 'status-pending',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return map[status] || 'status-pending';
  };

  if (loading || authLoading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',paddingTop:'70px'}}>
        <div style={{textAlign:'center',color:'var(--text-muted)'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>⏳</div>
          Loading your orders...
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--dark)',paddingTop:'90px',paddingBottom:'60px'}}>
      <div className="container" style={{paddingTop:'40px'}}>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:'2.5rem',marginBottom:'8px'}}>My Orders</h1>
        <p style={{color:'var(--text-muted)',marginBottom:'40px'}}>Track and manage your orders</p>

        {newOrderId && (
          <div className="alert alert-success" style={{marginBottom:'24px'}}>
            🎉 Order placed successfully! Your order ID: <strong>{newOrderId.slice(0, 8)}...</strong>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state" style={{paddingTop:'80px'}}>
            <div className="empty-state-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <Link href="/shop" className="btn btn-primary" style={{marginTop:'20px'}}>
              Browse Collection →
            </Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[...orders].reverse().map(order => (
              <div key={order.id}
                style={{
                  background:'var(--surface)',
                  border: order.id === newOrderId ? '1px solid var(--gold)' : '1px solid var(--border-light)',
                  borderRadius:'20px',
                  padding:'24px',
                  transition:'all 0.2s',
                }}
              >
                <div style={{display:'flex',alignItems:'start',justifyContent:'space-between',flexWrap:'wrap',gap:'16px',marginBottom:'16px'}}>
                  <div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>Order ID</div>
                    <div style={{fontFamily:'monospace',fontSize:'13px',color:'var(--gold)'}}>{order.id.slice(0,8).toUpperCase()}...</div>
                    <div style={{fontSize:'12px',color:'var(--text-dim)',marginTop:'4px'}}>
                      {new Date(order.createdAt).toLocaleDateString('en-PK', {day:'numeric',month:'long',year:'numeric'})}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className={`status-badge ${statusStyle(order.status)}`}>{order.status}</div>
                    <div style={{fontSize:'1.4rem',fontWeight:700,color:'var(--gold)',marginTop:'8px',fontFamily:'Cormorant Garamond,serif'}}>
                      Rs. {order.total.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'16px'}}>
                  {order.items.map(item => (
                    <div key={item.productId}
                      style={{
                        display:'flex',alignItems:'center',gap:'8px',
                        background:'var(--dark2)',border:'1px solid var(--border-light)',
                        borderRadius:'10px',padding:'8px 12px',
                        fontSize:'13px',
                      }}
                    >
                      <span>🧴</span>
                      <span>{item.productName} × {item.quantity}</span>
                      <span style={{color:'var(--gold)',fontWeight:600}}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Address Summary */}
                <div style={{display:'flex',gap:'24px',flexWrap:'wrap',borderTop:'1px solid var(--border-light)',paddingTop:'16px',fontSize:'13px',color:'var(--text-muted)'}}>
                  <div>
                    📍 {order.shippingAddress.street}, {order.shippingAddress.city}
                  </div>
                  <div>💳 {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</div>
                  {order.appliedDiscount && (
                    <div style={{color:'var(--success)'}}>🏷️ Discount: {order.appliedDiscount}</div>
                  )}
                  {order.shipping === 0 && (
                    <div style={{color:'var(--success)'}}>🚚 Free Shipping</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{paddingTop:'200px',textAlign:'center'}}>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
