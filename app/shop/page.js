'use client';
// app/shop/page.js - Shop with advanced filter sidebar
import { useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { secureFetch } from '@/lib/clientCrypto';

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [gender, setGender] = useState(searchParams.get('gender') || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minRating, setMinRating] = useState(parseFloat(searchParams.get('minRating')) || 0);
  const [sizeFilter, setSizeFilter] = useState('all');
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(searchParams.get('onSale') === 'true');

  // Read URL params on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    const g = searchParams.get('gender');
    const mr = searchParams.get('minRating');
    const sale = searchParams.get('onSale');
    if (cat) setActiveCategory(cat);
    if (g) setGender(g);
    if (mr) setMinRating(parseFloat(mr));
    if (sale === 'true') setOnSale(true);
  }, [searchParams]);

  useEffect(() => {
    secureFetch('/api/categories').then(res => setCategories(res.data.categories || []));
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    let url = '/api/products?';
    if (activeCategory !== 'all') url += `category=${activeCategory}&`;
    if (gender !== 'all') url += `gender=${gender}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (minRating > 0) url += `minRating=${minRating}&`;
    if (sizeFilter !== 'all') url += `size=${encodeURIComponent(sizeFilter)}&`;
    if (inStock) url += `inStock=true&`;
    if (priceRange[0] > 0) url += `minPrice=${priceRange[0]}&`;
    if (priceRange[1] < 10000) url += `maxPrice=${priceRange[1]}&`;

    secureFetch(url).then(res => {
      let prods = res.data.products || [];

      // Client-side: on sale filter
      if (onSale) {
        prods = prods.filter(p => p.originalPrice > p.price);
      }

      // Client-side sorting
      if (sort === 'price-asc') prods = [...prods].sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') prods = [...prods].sort((a, b) => b.price - a.price);
      else if (sort === 'rating') prods = [...prods].sort((a, b) => b.rating - a.rating);
      else if (sort === 'newest') prods = [...prods].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sort === 'name-asc') prods = [...prods].sort((a, b) => a.name.localeCompare(b.name));

      setProducts(prods);
      setLoading(false);
    });
  }, [activeCategory, gender, search, sort, minRating, sizeFilter, inStock, priceRange, onSale]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setActiveCategory('all');
    setGender('all');
    setSearch('');
    setSort('default');
    setPriceRange([0, 10000]);
    setMinRating(0);
    setSizeFilter('all');
    setInStock(false);
    setOnSale(false);
  };

  const hasActiveFilters = activeCategory !== 'all' || gender !== 'all' || search || minRating > 0 || sizeFilter !== 'all' || inStock || onSale || priceRange[0] > 0 || priceRange[1] < 10000;

  const genderOptions = [
    { value: 'all', label: 'All', icon: '🛍️' },
    { value: 'unisex', label: 'Unisex', icon: '👫' },
    { value: 'male', label: 'For Him', icon: '👨' },
    { value: 'female', label: 'For Her', icon: '👩' },
  ];

  const sizeOptions = ['all', '30ml', '50ml', '75ml', '100ml', '150ml', '200ml'];
  const ratingOptions = [0, 3, 3.5, 4, 4.5];

  return (
    <>
      {/* Shop Header */}
      <div className="shop-header">
        <div className="section-eyebrow">✦ FULL COLLECTION</div>
        <h1 className="section-title">Discover Your Scent</h1>
        <p className="section-sub" style={{ margin: '0 auto' }}>
          Browse {products.length} carefully curated fragrances from the finest perfume houses
        </p>
      </div>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Top toolbar */}
        <div className="shop-toolbar">
          <div className="shop-toolbar-left">
            <input
              type="text"
              placeholder="🔍 Search fragrances..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="shop-search-input"
              id="shop-search"
            />
            <button
              className={`btn btn-ghost btn-sm filter-toggle-btn ${hasActiveFilters ? 'has-filters' : ''}`}
              onClick={() => setFilterOpen(!filterOpen)}
              id="filter-toggle"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
                <circle cx="6" cy="6" r="2" fill="currentColor" /><circle cx="10" cy="12" r="2" fill="currentColor" /><circle cx="14" cy="18" r="2" fill="currentColor" />
              </svg>
              Filters {hasActiveFilters && <span className="filter-count-badge">!</span>}
            </button>
          </div>
          <div className="shop-toolbar-right">
            <select value={sort} onChange={e => setSort(e.target.value)} className="shop-sort-select" id="shop-sort">
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest First</option>
              <option value="name-asc">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Gender quick filters */}
        <div className="gender-filter-bar">
          {genderOptions.map(g => (
            <button
              key={g.value}
              className={`gender-chip ${gender === g.value ? 'active' : ''}`}
              onClick={() => setGender(g.value)}
            >
              <span className="gender-chip-icon">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="filter-bar">
          <button
            className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          {hasActiveFilters && (
            <button className="filter-chip clear-chip" onClick={clearFilters}>
              ✕ Clear All
            </button>
          )}
        </div>

        {/* Advanced filter panel */}
        <div className={`filter-panel ${filterOpen ? 'open' : ''}`}>
          <div className="filter-panel-inner">
            {/* Price Range */}
            <div className="filter-group">
              <div className="filter-group-title">💰 Price Range</div>
              <div className="price-range-inputs">
                <div className="price-input-wrap">
                  <label>Min</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <span className="price-range-sep">—</span>
                <div className="price-input-wrap">
                  <label>Max</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                    placeholder="10000"
                    min="0"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="price-slider"
              />
            </div>

            {/* Size */}
            <div className="filter-group">
              <div className="filter-group-title">📦 Size</div>
              <div className="filter-options-grid">
                {sizeOptions.map(s => (
                  <button
                    key={s}
                    className={`filter-option-btn ${sizeFilter === s ? 'active' : ''}`}
                    onClick={() => setSizeFilter(s)}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="filter-group">
              <div className="filter-group-title">⭐ Minimum Rating</div>
              <div className="filter-options-grid">
                {ratingOptions.map(r => (
                  <button
                    key={r}
                    className={`filter-option-btn ${minRating === r ? 'active' : ''}`}
                    onClick={() => setMinRating(r)}
                  >
                    {r === 0 ? 'Any' : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="filter-group">
              <div className="filter-group-title">🔖 Quick Filters</div>
              <div className="filter-toggles">
                <label className="filter-toggle-label">
                  <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                  <span className="toggle-switch" />
                  <span>In Stock Only</span>
                </label>
                <label className="filter-toggle-label">
                  <input type="checkbox" checked={onSale} onChange={e => setOnSale(e.target.checked)} />
                  <span className="toggle-switch" />
                  <span>On Sale Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div className="shimmer" style={{ height: '260px' }} />
                <div style={{ padding: '20px', background: 'var(--surface)' }}>
                  <div className="shimmer" style={{ height: '14px', borderRadius: '8px', marginBottom: '8px' }} />
                  <div className="shimmer" style={{ height: '20px', borderRadius: '8px', width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No fragrances found</h3>
            <p>Try a different search or adjust your filters</p>
            <button className="btn btn-outline btn-sm" style={{ marginTop: '16px' }} onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid-4 fade-in">
            {products.map(p => (
              <ProductCard key={p.id} product={p} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
