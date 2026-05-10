'use client';
// app/admin/orders/page.js
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { secureFetch } from '@/lib/clientCrypto';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const { data } = await secureFetch('/api/orders');
    setOrders((data.orders || []).reverse());
    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { ok } = await secureFetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (ok) { toast(`Order status updated to "${status}"`); loadOrders(); }
    else toast('Failed to update', 'error');
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const statusStyle = s => ({pending:'status-pending',processing:'status-processing',shipped:'status-shipped',delivered:'status-delivered',cancelled:'status-cancelled'}[s] || 'status-pending');

  if (loading) return <div style={{textAlign:'center',paddingTop:'80px',color:'var(--text-muted)'}}>Loading orders...</div>;

  return (
    <>
      <div className="admin-header">
        <h1>Orders</h1>
        <p>Manage customer orders and update statuses</p>
      </div>

      {/* Summary */}
      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'24px'}}>
        {[{label:'All',val:'all'}, ...STATUSES.map(s => ({label:s.charAt(0).toUpperCase()+s.slice(1),val:s}))].map(f => {
          const count = f.val === 'all' ? orders.length : orders.filter(o => o.status === f.val).length;
          return (
            <button
              key={f.val}
              className={`filter-chip ${filter === f.val ? 'active' : ''}`}
              onClick={() => setFilter(f.val)}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <>
                <tr key={o.id} style={{cursor:'pointer'}} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td style={{fontFamily:'monospace',fontSize:'11px',color:'var(--gold)'}}>{o.id.slice(0,8).toUpperCase()}</td>
                  <td>
                    <div style={{fontWeight:500,fontSize:'13px'}}>{o.userName}</div>
                    <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{o.userEmail}</div>
                  </td>
                  <td style={{fontSize:'13px'}}>{o.items.length}</td>
                  <td style={{color:'var(--gold)',fontWeight:700,fontSize:'13px'}}>Rs. {o.total.toLocaleString()}</td>
                  <td style={{fontSize:'12px',textTransform:'capitalize'}}>{o.paymentMethod}</td>
                  <td><span className={`status-badge ${statusStyle(o.status)}`}>{o.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      style={{width:'130px',padding:'6px',fontSize:'12px'}}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td style={{fontSize:'11px',color:'var(--text-muted)'}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
                {expanded === o.id && (
                  <tr key={`${o.id}-detail`}>
                    <td colSpan={8} style={{background:'var(--dark3)',padding:'20px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px'}}>
                        <div>
                          <div style={{fontSize:'11px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Items</div>
                          {o.items.map(item => (
                            <div key={item.productId} style={{fontSize:'13px',marginBottom:'4px',color:'var(--text-muted)'}}>
                              🧴 {item.productName} × {item.quantity} = Rs. {(item.price * item.quantity).toLocaleString()}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{fontSize:'11px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Shipping Address</div>
                          <div style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:'1.8'}}>
                            {o.shippingAddress.fullName}<br />
                            {o.shippingAddress.phone}<br />
                            {o.shippingAddress.street}<br />
                            {o.shippingAddress.city}, {o.shippingAddress.province}<br />
                            {o.shippingAddress.country}
                          </div>
                        </div>
                        <div>
                          <div style={{fontSize:'11px',color:'var(--gold)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Order Summary</div>
                          {[
                            ['Subtotal', `Rs. ${o.subtotal.toLocaleString()}`],
                            o.discountAmount > 0 && ['Discount', `-Rs. ${o.discountAmount.toLocaleString()}`],
                            ['Shipping', o.shipping === 0 ? 'FREE' : `Rs. ${o.shipping}`],
                            ['Total', `Rs. ${o.total.toLocaleString()}`],
                          ].filter(Boolean).map(([k, v]) => (
                            <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'4px',color:'var(--text-muted)'}}>
                              <span>{k}</span>
                              <span style={{color: k === 'Total' ? 'var(--gold)' : 'var(--text-muted)',fontWeight: k === 'Total' ? 700 : 400}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-muted)',padding:'40px'}}>No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
