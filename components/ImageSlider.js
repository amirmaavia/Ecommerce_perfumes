'use client';
// components/ImageSlider.js - Auto-sliding hero carousel for featured products
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function ImageSlider({ products = [], categories = [] }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const slides = products.slice(0, 6);

  const goTo = useCallback((index) => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, slides.length]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, goTo]);

  // Auto-slide
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next, slides.length, isPaused]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setTouchStart(null);
  };

  if (slides.length === 0) return null;

  const slide = slides[current];
  const cat = categories.find(c => c.id === slide?.category);
  const discount = slide.originalPrice > slide.price
    ? Math.round(((slide.originalPrice - slide.price) / slide.originalPrice) * 100)
    : 0;

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image with overlay */}
      <div className="hero-slider-bg">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`hero-slider-bg-img ${i === current ? 'active' : ''}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
        <div className="hero-slider-overlay" />
      </div>

      {/* Content */}
      <div className="hero-slider-content">
        <div className="hero-slider-grid">
          {/* Left: Product Info */}
          <div className={`hero-slider-info ${isAnimating ? 'animating' : ''}`}>
            <div className="hero-slider-eyebrow">
              {cat?.name || 'Fragrance'} {slide.gender && `· ${slide.gender === 'male' ? 'For Him' : slide.gender === 'female' ? 'For Her' : 'Unisex'}`}
            </div>
            <h2 className="hero-slider-title">{slide.name}</h2>
            <p className="hero-slider-desc">{slide.description}</p>
            <div className="hero-slider-price">
              <span className="hero-slider-price-current">Rs. {slide.price.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="hero-slider-price-old">Rs. {slide.originalPrice.toLocaleString()}</span>
                  <span className="hero-slider-price-badge">{discount}% OFF</span>
                </>
              )}
            </div>
            <div className="hero-slider-rating">
              <span className="stars">{'★'.repeat(Math.round(slide.rating))}{'☆'.repeat(5 - Math.round(slide.rating))}</span>
              <span>{slide.rating} ({slide.reviews} reviews)</span>
            </div>
            <div className="hero-slider-actions">
              <Link href={`/shop/${slide.id}`} className="btn btn-primary btn-lg">
                View Product →
              </Link>
              <Link href="/shop" className="btn btn-outline btn-lg">
                Browse All
              </Link>
            </div>
          </div>

          {/* Right: Product Image */}
          <div className="hero-slider-image-wrap">
            <div className={`hero-slider-image ${isAnimating ? 'animating' : ''}`}>
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '120px', opacity: 0.3 }}>🧴</span>
              )}
              {discount > 0 && (
                <div className="hero-slider-discount-badge">SAVE {discount}%</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button className="slider-arrow slider-arrow-left" onClick={prev} aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="slider-arrow slider-arrow-right" onClick={next} aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`slider-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !isPaused && (
        <div className="slider-progress">
          <div className="slider-progress-bar" key={current} />
        </div>
      )}
    </div>
  );
}
