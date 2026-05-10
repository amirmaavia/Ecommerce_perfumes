'use client';
// app/shop/[id]/page.js - Product Detail with Size Variants & Image Gallery
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ToastProvider';
import { secureFetch } from '@/lib/clientCrypto';

const genderLabels = { male: '♂ For Him', female: '♀ For Her', unisex: '⚤ Unisex' };

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);

  // Touch/swipe for gallery
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    Promise.all([
      secureFetch(`/api/products/${id}`),
      secureFetch('/api/categories'),
    ]).then(([prodRes, catRes]) => {
      const prod = prodRes.data.product;
      setProduct(prod);
      setCategories(catRes.data.categories || []);
      // Auto-select matching variant or first variant
      if (prod?.variants?.length > 0) {
        const match = prod.variants.find(v => v.size === prod.size);
        setSelectedSize(match ? match.size : prod.variants[0].size);
      } else {
        setSelectedSize(prod?.size || null);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div style={{ paddingTop: '180px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '60px', marginBottom: '16px' }}>⏳</div>
      Loading product...
    </div>
  );

  if (!product) return (
    <div style={{ paddingTop: '180px', textAlign: 'center' }}>
      <div style={{ fontSize: '60px', marginBottom: '16px' }}>❌</div>
      <h2>Product not found</h2>
      <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => router.push('/shop')}>
        Back to Shop
      </button>
    </div>
  );

  // Get active variant data
  const activeVariant = product.variants?.find(v => v.size === selectedSize);
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentOriginalPrice = activeVariant ? (activeVariant.originalPrice || activeVariant.price) : product.originalPrice;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;
  const currentImages = activeVariant?.images?.length > 0 ? activeVariant.images : (product.images?.length > 0 ? product.images : (product.image ? [product.image] : []));

  const cat = categories.find(c => c.id === product.category);
  const discount = currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;

  const gallery = currentImages;

  const handleAddToCart = () => {
    // Pass the full product with variant info
    const cartProduct = {
      ...product,
      price: currentPrice,
      stock: currentStock,
      image: currentImages[0] || product.image,
    };
    addToCart(cartProduct, quantity, selectedSize);
    toast(`${product.name} (${selectedSize}) added to cart! 🛍️`);
    document.dispatchEvent(new CustomEvent('openCart'));
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setActiveImg(0);
    setQuantity(1);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveImg(i => (i + 1) % gallery.length);
      else setActiveImg(i => (i - 1 + gallery.length) % gallery.length);
    }
    setTouchStart(null);
  };

  const hasVariants = product.variants && product.variants.length > 1;

  return (
    <div style={{ paddingTop: '80px', paddingBottom: '80px', minHeight: '100vh', background: 'var(--dark)' }}>
      <div className="container" style={{ paddingTop: '20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: 'var(--text-muted)' }}>Home</a>
          <span>/</span>
          <a href="/shop" style={{ color: 'var(--text-muted)' }}>Shop</a>
          <span>/</span>
          <span style={{ color: 'var(--gold)' }}>{product.name}</span>
        </div>

        <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
          {/* Left: Image Gallery */}
          <div>
            {/* Main Image */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--dark2) 0%, var(--dark3) 100%)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: gallery.length > 1 ? '12px' : '0',
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {gallery.length > 0 ? (
                <img
                  src={gallery[activeImg]}
                  alt={`${product.name} - image ${activeImg + 1}`}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease',
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '120px', opacity: 0.3 }}>🧴</span>
              )}
              {discount > 0 && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'var(--gold)', color: '#000',
                  padding: '6px 14px', borderRadius: '100px',
                  fontWeight: 700, fontSize: '13px',
                }}>
                  SAVE {discount}%
                </div>
              )}
              {product.gender && (
                <div style={{
                  position: 'absolute', top: '16px', left: '16px',
                  background: product.gender === 'male' ? '#2196F3' : product.gender === 'female' ? '#E91E63' : '#7C4DFF',
                  color: '#fff',
                  padding: '5px 12px', borderRadius: '100px',
                  fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px',
                }}>
                  {genderLabels[product.gender]}
                </div>
              )}
              {/* Navigation arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg(i => (i - 1 + gallery.length) % gallery.length)}
                    className="slider-arrow slider-arrow-left"
                    style={{ position: 'absolute' }}
                  >‹</button>
                  <button
                    onClick={() => setActiveImg(i => (i + 1) % gallery.length)}
                    className="slider-arrow slider-arrow-right"
                    style={{ position: 'absolute' }}
                  >›</button>
                </>
              )}
              {/* Dots on mobile */}
              {gallery.length > 1 && (
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      style={{
                        width: activeImg === idx ? '20px' : '8px', height: '8px',
                        borderRadius: '4px',
                        background: activeImg === idx ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                        border: 'none', cursor: 'pointer', padding: 0,
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    style={{
                      width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden',
                      border: activeImg === idx ? '2px solid var(--gold)' : '2px solid transparent',
                      padding: 0, cursor: 'pointer',
                      background: 'var(--dark2)',
                      transition: 'all 0.2s',
                      transform: activeImg === idx ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--gold)', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {cat?.name || 'Fragrance'}
              </span>
              {product.gender && (
                <span style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '100px',
                  background: product.gender === 'male' ? 'rgba(33,150,243,0.15)' : product.gender === 'female' ? 'rgba(233,30,99,0.15)' : 'rgba(124,77,255,0.15)',
                  color: product.gender === 'male' ? '#2196F3' : product.gender === 'female' ? '#E91E63' : '#7C4DFF',
                  fontWeight: 600,
                }}>
                  {genderLabels[product.gender]}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '12px', color: 'var(--text)' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--gold)', fontSize: '18px' }}>
                {'★'.repeat(Math.round(product.rating || 0))}{'☆'.repeat(5 - Math.round(product.rating || 0))}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{product.rating} ({product.reviews} reviews)</span>
            </div>

            {/* ===== SIZE SELECTOR ===== */}
            {hasVariants && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px', fontWeight: 600 }}>
                  📦 Select Size
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.variants.map(v => {
                    const isActive = selectedSize === v.size;
                    const isOutOfStock = v.stock <= 0;
                    const vDiscount = v.originalPrice > v.price
                      ? Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100)
                      : 0;
                    return (
                      <button
                        key={v.size}
                        onClick={() => !isOutOfStock && handleSizeChange(v.size)}
                        disabled={isOutOfStock}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '14px',
                          border: isActive
                            ? '2px solid var(--gold)'
                            : '2px solid var(--border)',
                          background: isActive
                            ? 'rgba(201,169,110,0.12)'
                            : 'var(--surface)',
                          color: isOutOfStock ? 'var(--text-dim)' : 'var(--text)',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          opacity: isOutOfStock ? 0.5 : 1,
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          minWidth: '100px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                          {v.size}
                        </div>
                        <div style={{ fontSize: '13px', color: isActive ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                          Rs. {v.price.toLocaleString()}
                        </div>
                        {vDiscount > 0 && (
                          <div style={{ fontSize: '10px', color: '#E53935', fontWeight: 700, marginTop: '2px' }}>
                            -{vDiscount}% OFF
                          </div>
                        )}
                        {isOutOfStock && (
                          <div style={{ fontSize: '10px', color: 'var(--error)', fontWeight: 600, marginTop: '2px' }}>
                            Out of Stock
                          </div>
                        )}
                        {isActive && (
                          <div style={{
                            position: 'absolute', top: '-6px', right: '-6px',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'var(--gold)', color: '#000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700,
                          }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--gold)' }}>
                Rs. {currentPrice.toLocaleString()}
              </span>
              {discount > 0 && (
                <div>
                  <div style={{ color: 'var(--text-dim)', textDecoration: 'line-through', fontSize: '1rem' }}>
                    Rs. {currentOriginalPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', background: 'rgba(229,57,53,0.15)', color: '#E53935', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                    You save Rs. {(currentOriginalPrice - currentPrice).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: '1.9', marginBottom: '28px', fontSize: '15px' }}>
              {product.description}
            </p>

            {/* Notes */}
            {product.notes && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontWeight: 600 }}>
                  Fragrance Notes
                </div>
                {[
                  { label: 'Top Notes', value: product.notes.top, icon: '🌿' },
                  { label: 'Heart Notes', value: product.notes.heart, icon: '🌹' },
                  { label: 'Base Notes', value: product.notes.base, icon: '🌲' },
                ].map(n => n.value && (
                  <div key={n.label} style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{n.icon}</span>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>{n.label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{n.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Size & Stock */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', fontSize: '13px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px' }}>
                📦 Size: <strong>{selectedSize || product.size}</strong>
                {hasVariants && <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}> · {product.variants.length} sizes available</span>}
              </div>
              <div style={{
                background: currentStock > 0 ? 'rgba(76,175,80,0.1)' : 'rgba(229,57,53,0.1)',
                border: `1px solid ${currentStock > 0 ? 'rgba(76,175,80,0.3)' : 'rgba(229,57,53,0.3)'}`,
                borderRadius: '8px',
                padding: '10px 16px',
                color: currentStock > 0 ? 'var(--success)' : 'var(--error)',
              }}>
                {currentStock > 0 ? `✅ ${currentStock} in stock` : '❌ Out of stock'}
              </div>
            </div>

            {/* Quantity + Cart */}
            {currentStock > 0 && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 16px' }}>
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '32px', height: '32px' }}>−</button>
                  <span style={{ fontSize: '18px', fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.min(currentStock, q + 1))} style={{ width: '32px', height: '32px' }}>+</button>
                </div>
                <button className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '200px' }} onClick={handleAddToCart}>
                  🛍️ Add to Cart — Rs. {(currentPrice * quantity).toLocaleString()}
                </button>
              </div>
            )}

            {/* Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginTop: '32px' }}>
              {['🚚 Free Shipping on Rs. 5000+', '↩️ 30-Day Returns', '🔒 Secure Payment', '✅ Authentic Products'].map(b => (
                <div key={b} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
