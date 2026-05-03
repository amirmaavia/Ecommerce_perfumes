'use client';
// app/checkout/page.js
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

const EMPTY_ADDR = { fullName: '', phone: '', street: '', city: '', province: '', postalCode: '', country: 'Pakistan' };

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [address, setAddress] = useState(EMPTY_ADDR);
  const [discountCode, setDiscountCode] = useState('');
  const [discountData, setDiscountData] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/login');
    }
    // Pre-fill from saved address
    if (user?.addresses?.length > 0) {
      const a = user.addresses[0];
      setAddress(a);
    }
  }, [user]);

  const shipping = subtotal > 5000 ? 0 : 199;
  const discountAmt = discountData?.discountAmount || 0;
  const total = subtotal - discountAmt + shipping;

  const validateDiscount = async () => {
    setDiscountError('');
    if (!discountCode.trim()) return;
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscountError(data.error); setDiscountData(null); }
      else { setDiscountData(data); toast('Discount applied! 🎉'); }
    } catch { setDiscountError('Failed to validate code'); }
  };

  const handleOrder = async () => {
    if (!address.fullName || !address.street || !address.city || !address.phone) {
      toast('Please fill all required address fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: address,
          discountCode: discountData ? discountCode : null,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error, 'error'); setLoading(false); return; }
      clearCart();
      toast('Order placed successfully! 🎉');
      router.push(`/orders?new=${data.order.id}`);
    } catch { toast('Failed to place order', 'error'); }
    setLoading(false);
  };

  if (cart.length === 0 && typeof window !== 'undefined') {
    return (
      <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:'70px'}}>
        <div className="empty-state">
          <div className="empty-state-icon">🛍️</div>
          <h3>Your cart is empty</h3>
          <Link href="/shop" className="btn btn-primary" style={{marginTop:'20px'}}>Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--dark)',paddingTop:'90px',paddingBottom:'60px'}}>
      <div className="container" style={{paddingTop:'40px'}}>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:'2.5rem',marginBottom:'8px'}}>Checkout</h1>
        <p style={{color:'var(--text-muted)',marginBottom:'40px'}}>Complete your order</p>

        <div className="checkout-grid">
          {/* Left: Form */}
          <div>
            {/* Step 1: Address */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border-light)',borderRadius:'20px',padding:'32px',marginBottom:'20px'}}>
              <h2 style={{fontSize:'1.3rem',marginBottom:'24px',display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{background:'var(--gold)',color:'#000',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700}}>1</span>
                Shipping Address
              </h2>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input id="addr-name" placeholder="Muhammad Ali" value={address.fullName} onChange={e => setAddress({...address,fullName:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input id="addr-phone" placeholder="+92 300 1234567" value={address.phone} onChange={e => setAddress({...address,phone:e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Street Address *</label>
                  <input id="addr-street" placeholder="House # 123, Street 4, Block A" value={address.street} onChange={e => setAddress({...address,street:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input id="addr-city" placeholder="Karachi" value={address.city} onChange={e => setAddress({...address,city:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Province</label>
                  <select value={address.province} onChange={e => setAddress({...address,province:e.target.value})}>
                    <option value="">Select Province</option>
                    {['Punjab','Sindh','KPK','Balochistan','Islamabad'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input id="addr-postal" placeholder="75500" value={address.postalCode} onChange={e => setAddress({...address,postalCode:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input value={address.country} onChange={e => setAddress({...address,country:e.target.value})} />
                </div>
              </div>
            </div>

            {/* Step 2: Payment */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border-light)',borderRadius:'20px',padding:'32px',marginBottom:'20px'}}>
              <h2 style={{fontSize:'1.3rem',marginBottom:'24px',display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{background:'var(--gold)',color:'#000',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700}}>2</span>
                Payment Method
              </h2>
              {[
                {id:'cod',label:'Cash on Delivery',icon:'💵',desc:'Pay when your order arrives'},
                {id:'bank',label:'Bank Transfer',icon:'🏦',desc:'Direct deposit to our account'},
                {id:'easypaisa',label:'EasyPaisa / JazzCash',icon:'📱',desc:'Mobile wallet payment'},
              ].map(method => (
                <div key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    display:'flex',alignItems:'center',gap:'16px',
                    padding:'16px 20px',borderRadius:'12px',
                    border:`2px solid ${paymentMethod === method.id ? 'var(--gold)' : 'var(--border)'}`,
                    background: paymentMethod === method.id ? 'rgba(201,169,110,0.08)' : 'transparent',
                    cursor:'pointer',marginBottom:'10px',
                    transition:'all 0.2s',
                  }}
                >
                  <span style={{fontSize:'24px'}}>{method.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:'14px'}}>{method.label}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{method.desc}</div>
                  </div>
                  <div style={{
                    width:'18px',height:'18px',borderRadius:'50%',
                    border:`2px solid ${paymentMethod === method.id ? 'var(--gold)' : 'var(--border)'}`,
                    background: paymentMethod === method.id ? 'var(--gold)' : 'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}>
                    {paymentMethod === method.id && <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#000'}} />}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{width:'100%'}}
              onClick={handleOrder}
              disabled={loading}
              id="place-order-btn"
            >
              {loading ? 'Placing Order...' : `Place Order — Rs. ${total.toLocaleString()} →`}
            </button>
          </div>

          {/* Right: Order Summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>

            {/* Items */}
            <div style={{marginBottom:'20px'}}>
              {cart.map(item => (
                <div key={item.productId} style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'12px'}}>
                  <div style={{width:'48px',height:'56px',background:'var(--dark3)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>
                    🧴
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:500}}>{item.name}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:'14px',color:'var(--gold)'}}>
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div style={{marginBottom:'20px'}}>
              <div style={{display:'flex',gap:'8px'}}>
                <input
                  id="discount-input"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  style={{flex:1}}
                />
                <button className="btn btn-outline btn-sm" onClick={validateDiscount}>Apply</button>
              </div>
              {discountError && <div style={{fontSize:'12px',color:'var(--error)',marginTop:'6px'}}>{discountError}</div>}
              {discountData && (
                <div style={{fontSize:'12px',color:'var(--success)',marginTop:'6px'}}>
                  ✅ {discountData.discount.type === 'percentage' ? `${discountData.discount.value}%` : `Rs. ${discountData.discount.value}`} discount applied!
                </div>
              )}
            </div>

            <div className="divider" />

            {/* Totals */}
            <div className="cart-total-row">
              <span style={{color:'var(--text-muted)'}}>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discountAmt > 0 && (
              <div className="cart-total-row">
                <span style={{color:'var(--success)'}}>Discount</span>
                <span style={{color:'var(--success)'}}>−Rs. {discountAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="cart-total-row">
              <span style={{color:'var(--text-muted)'}}>Shipping</span>
              <span style={{color: shipping === 0 ? 'var(--success)' : 'var(--text)'}}>
                {shipping === 0 ? 'FREE' : `Rs. ${shipping}`}
              </span>
            </div>
            <div className="divider" />
            <div className="cart-total-row" style={{fontSize:'20px',fontWeight:700}}>
              <span>Total</span>
              <span style={{color:'var(--gold)'}}>Rs. {total.toLocaleString()}</span>
            </div>

            {/* Trust badges */}
            <div style={{marginTop:'20px',padding:'16px',background:'rgba(201,169,110,0.05)',border:'1px solid var(--border)',borderRadius:'12px'}}>
              {['🔒 SSL Encrypted','📦 Free Returns in 30 days','✅ 100% Authentic'].map(b => (
                <div key={b} style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'6px'}}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
