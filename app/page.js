'use client';
// app/page.js - Homepage with Hero Slider
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ImageSlider from '@/components/ImageSlider';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products?featured=true').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([featData, allData, catData]) => {
      setFeatured(featData.products || []);
      setAllProducts(allData.products || []);
      setCategories(catData.categories || []);
    });
  }, []);

  return (
    <>
      {/* Hero Slider */}
      <ImageSlider products={featured} categories={categories} />

      {/* Category Strip */}
      <section className="category-strip">
        <div className="container">
          <div className="category-strip-grid">
            {categories.map(cat => (
              <Link key={cat.id} href={`/shop?category=${cat.id}`} className="category-card">
                <div className="category-card-icon">
                  {cat.name === 'Oud' ? '🌿' : cat.name === 'Floral' ? '🌹' : cat.name === 'Citrus' ? '🍋' : '💎'}
                </div>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-desc">{cat.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gender Quick Shop */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">✦ SHOP BY GENDER</div>
            <h2 className="section-title">Find Your Perfect Match</h2>
          </div>
          <div className="gender-cards-grid">
            {[
              { label: 'For Him', icon: '👨', desc: 'Bold, masculine fragrances', href: '/shop?gender=male', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
              { label: 'For Her', icon: '👩', desc: 'Elegant, feminine scents', href: '/shop?gender=female', gradient: 'linear-gradient(135deg, #2d1b2e 0%, #1e1631 100%)' },
              { label: 'Unisex', icon: '👫', desc: 'Universal, inclusive fragrances', href: '/shop?gender=unisex', gradient: 'linear-gradient(135deg, #1b2e1d 0%, #162e21 100%)' },
            ].map(g => (
              <Link key={g.label} href={g.href} className="gender-card" style={{ background: g.gradient }}>
                <div className="gender-card-icon">{g.icon}</div>
                <h3 className="gender-card-title">{g.label}</h3>
                <p className="gender-card-desc">{g.desc}</p>
                <span className="gender-card-link">Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">✦ CURATED FOR YOU</div>
            <h2 className="section-title">Featured Collection</h2>
            <p className="section-sub">Handpicked luxury fragrances loved by our community</p>
          </div>
          <div className="grid-4">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} categories={categories} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/shop" className="btn btn-outline btn-lg">View All Fragrances →</Link>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="promo-banner">
        <div className="promo-banner-content">
          <div>
            <div className="section-eyebrow">✦ LIMITED OFFER</div>
            <h2 className="promo-banner-title">
              First Order Gets<br /><span style={{ color: 'var(--gold)' }}>20% Off</span>
            </h2>
            <p className="promo-banner-desc">
              Join LUXE Club and receive exclusive discounts, early access to new collections, and personalized scent recommendations.
            </p>
          </div>
          <div className="promo-banner-actions">
            <Link href="/register" className="btn btn-primary btn-lg">Create Account</Link>
            <Link href="/shop" className="btn btn-outline btn-lg">Browse Perfumes</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">LUXE</div>
            <p className="footer-desc">
              Premium fragrances from around the world, delivered to your door.
            </p>
          </div>
          {[
            { title: 'Shop', links: [
              { label: 'All Fragrances', href: '/shop' },
              { label: 'For Him', href: '/shop?gender=male' },
              { label: 'For Her', href: '/shop?gender=female' },
              { label: 'Unisex', href: '/shop?gender=unisex' },
            ]},
            { title: 'Categories', links: [
              { label: 'Oud Collection', href: '/shop?category=cat1' },
              { label: 'Floral', href: '/shop?category=cat2' },
              { label: 'Citrus', href: '/shop?category=cat3' },
              { label: 'Luxury', href: '/shop?category=cat4' },
            ]},
            { title: 'Support', links: [
              { label: 'Track Order', href: '/orders' },
              { label: 'Returns', href: '#' },
              { label: 'FAQ', href: '#' },
              { label: 'Contact', href: '#' },
            ]},
          ].map(col => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              {col.links.map(l => (
                <div key={l.label} className="footer-link-wrap">
                  <Link href={l.href} className="footer-link">{l.label}</Link>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© 2024 LUXE Parfums. All rights reserved.</p>
          <p>Made with ♥ for fragrance lovers</p>
        </div>
      </footer>
    </>
  );
}
