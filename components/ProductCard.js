'use client';
// components/ProductCard.js - Enhanced with gender badge and clear images
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i}>{i <= Math.round(rating) ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

const genderLabels = { male: '♂ Him', female: '♀ Her', unisex: '⚤ Unisex' };

export default function ProductCard({ product, categories = [] }) {
  const { addToCart } = useCart();
  const toast = useToast();

  const cat = categories.find(c => c.id === product.category);
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addToCart(product, 1);
    toast(`${product.name} added to cart! 🛍️`);
    document.dispatchEvent(new CustomEvent('openCart'));
  };

  return (
    <Link href={`/shop/${product.id}`} className="product-card" style={{display:'block',textDecoration:'none'}}>
      <div className="product-img-wrap">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
              transition: 'transform 0.4s ease',
            }}
            onError={e => { e.target.style.display = 'none'; if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className="perfume-icon" style={{ display: product.image ? 'none' : 'flex' }}>🧴</div>

        {/* Badges */}
        <div className="product-badges-wrap">
          {product.featured && <div className="product-badge">Featured</div>}
          {product.gender && product.gender !== 'unisex' && (
            <div className={`product-badge gender-badge gender-${product.gender}`}>
              {genderLabels[product.gender]}
            </div>
          )}
          {product.gender === 'unisex' && (
            <div className="product-badge gender-badge gender-unisex">
              {genderLabels.unisex}
            </div>
          )}
        </div>

        {discount > 0 && <div className="product-badge sale" style={{top:'12px',left:'auto',right:'12px'}}>{discount}% OFF</div>}
        {product.stock === 0 && (
          <div className="product-badge" style={{top:'12px',left:'auto',right:'12px',background:'#666'}}>Out of Stock</div>
        )}

        {/* Hover overlay */}
        <div className="product-overlay">
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        </div>

        {/* Image count indicator */}
        {product.images && product.images.length > 1 && (
          <div className="product-img-count">
            📷 {product.images.length}
          </div>
        )}
      </div>
      <div className="product-body">
        <div className="product-category">{cat?.name || 'Fragrance'}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-rating">
          <Stars rating={product.rating || 0} />
          <span>{product.rating || 0} ({product.reviews || 0})</span>
        </div>
        <div className="product-price">
          <span className="price-current">Rs. {product.price.toLocaleString()}</span>
          {discount > 0 && (
            <>
              <span className="price-original">Rs. {product.originalPrice.toLocaleString()}</span>
              <span className="price-discount">SAVE {discount}%</span>
            </>
          )}
        </div>
        <div className="product-meta">
          {product.size} · {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
        </div>
      </div>
    </Link>
  );
}
