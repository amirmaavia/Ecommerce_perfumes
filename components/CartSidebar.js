'use client';
// components/CartSidebar.js
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartSidebar() {
  const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('openCart', handler);
    return () => document.removeEventListener('openCart', handler);
  }, []);

  const shipping = subtotal > 5000 ? 0 : 199;

  return (
    <>
      {open && <div className="cart-overlay" onClick={() => setOpen(false)} />}

      <aside className={`cart-sidebar ${open ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>🛍️ Your Cart <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>({totalItems} items)</span></h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-state" style={{paddingTop:'60px'}}>
              <div className="empty-state-icon">🛍️</div>
              <h3>Your cart is empty</h3>
              <p style={{marginTop:'8px',fontSize:'14px'}}>Discover our luxury fragrances</p>
              <button
                className="btn btn-primary btn-sm"
                style={{marginTop:'20px'}}
                onClick={() => { setOpen(false); router.push('/shop'); }}
              >
                Browse Collection
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartKey} className="cart-item">
                <div className="cart-item-img">
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} onError={e => { e.target.style.display='none'; }} />
                  ) : '🧴'}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',marginTop:'2px',marginBottom:'4px'}}>
                    <div className="cart-item-price">Rs. {item.price.toLocaleString()}</div>
                    {item.size && item.size !== 'default' && (
                      <span style={{
                        fontSize:'10px',padding:'2px 8px',borderRadius:'100px',
                        background:'rgba(201,169,110,0.15)',color:'var(--gold)',fontWeight:600,
                      }}>
                        {item.size}
                      </span>
                    )}
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>−</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}>+</button>
                    <button
                      style={{marginLeft:'auto',color:'var(--error)',background:'none',border:'none',cursor:'pointer',fontSize:'12px'}}
                      onClick={() => removeFromCart(item.cartKey)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-total-row">
              <span>Shipping</span>
              <span style={{color:'var(--success)'}}>
                {shipping === 0 ? 'FREE' : `Rs. ${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <p style={{fontSize:'11px',color:'var(--text-dim)',marginBottom:'8px'}}>
                Free shipping on orders over Rs. 5,000
              </p>
            )}
            <div className="cart-total-row final">
              <span>Total</span>
              <span>Rs. {(subtotal + shipping).toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{width:'100%',marginTop:'16px'}}
              onClick={() => { setOpen(false); router.push('/checkout'); }}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
