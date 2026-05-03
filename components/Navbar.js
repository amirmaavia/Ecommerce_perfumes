'use client';
// components/Navbar.js - Fully responsive with hamburger menu & hover shop dropdown
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopDropdown, setShopDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownTimer = useRef(null);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setShopDropdown(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShopDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCart = () => {
    document.dispatchEvent(new CustomEvent('openCart'));
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const isAdmin = user?.role === 'admin';

  const shopFilters = [
    { label: '🛍️ All Fragrances', href: '/shop' },
    { label: '👫 Unisex', href: '/shop?gender=unisex' },
    { label: '👨 For Him', href: '/shop?gender=male' },
    { label: '👩 For Her', href: '/shop?gender=female' },
    { label: '🌿 Oud Collection', href: '/shop?category=cat1' },
    { label: '🌹 Floral', href: '/shop?category=cat2' },
    { label: '🍋 Citrus', href: '/shop?category=cat3' },
    { label: '💎 Luxury', href: '/shop?category=cat4' },
    { label: '⭐ Top Rated', href: '/shop?minRating=4.5' },
    { label: '🔥 On Sale', href: '/shop?onSale=true' },
  ];

  const handleDropdownEnter = () => {
    clearTimeout(dropdownTimer.current);
    setShopDropdown(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimer.current = setTimeout(() => setShopDropdown(false), 200);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="main-navbar">
        <Link href="/" className="navbar-brand">
          LUXE <span>PARFUMS</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-nav desktop-nav">
          {/* Shop with dropdown */}
          <li
            className="nav-dropdown-wrap"
            ref={dropdownRef}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <Link href="/shop" className={`nav-link ${pathname === '/shop' ? 'active' : ''}`}>
              Shop
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: '4px' }}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {shopDropdown && (
              <div className="nav-dropdown" onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
                <div className="nav-dropdown-inner">
                  <div className="nav-dropdown-section">
                    <div className="nav-dropdown-title">Shop By</div>
                    {shopFilters.slice(0, 4).map(f => (
                      <Link key={f.href} href={f.href} className="nav-dropdown-link" onClick={() => setShopDropdown(false)}>
                        {f.label}
                      </Link>
                    ))}
                  </div>
                  <div className="nav-dropdown-section">
                    <div className="nav-dropdown-title">Categories</div>
                    {shopFilters.slice(4, 8).map(f => (
                      <Link key={f.href} href={f.href} className="nav-dropdown-link" onClick={() => setShopDropdown(false)}>
                        {f.label}
                      </Link>
                    ))}
                  </div>
                  <div className="nav-dropdown-section">
                    <div className="nav-dropdown-title">Discover</div>
                    {shopFilters.slice(8).map(f => (
                      <Link key={f.href} href={f.href} className="nav-dropdown-link" onClick={() => setShopDropdown(false)}>
                        {f.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </li>

          {user && (
            <li>
              <Link href="/orders" className={`nav-link ${pathname === '/orders' ? 'active' : ''}`}>My Orders</Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
                ⚙️ Admin
              </Link>
            </li>
          )}
          {user ? (
            <>
              <li>
                <span className="nav-user-greeting">
                  Hi, {user.name.split(' ')[0]}
                </span>
              </li>
              <li>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`}>Login</Link>
              </li>
              <li>
                <Link href="/register" className="btn btn-primary btn-sm">Join Now</Link>
              </li>
            </>
          )}
          <li>
            <button className="btn btn-ghost btn-sm cart-badge" onClick={openCart} id="cart-btn">
              🛍️ Cart
              {totalItems > 0 && <span className="badge">{totalItems}</span>}
            </button>
          </li>
        </ul>

        {/* Mobile: Cart + Hamburger */}
        <div className="mobile-nav-actions">
          <button className="btn btn-ghost btn-sm cart-badge" onClick={openCart} id="cart-btn-mobile">
            🛍️
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </button>
          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="hamburger-btn"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobile-menu">
        <div className="mobile-menu-header">
          <div className="navbar-brand">LUXE <span>PARFUMS</span></div>
          <button className="mobile-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <div className="mobile-menu-body">
          {/* Shop section with sub-links */}
          <div className="mobile-menu-section">
            <div className="mobile-section-title">Shop</div>
            <div className="mobile-filter-grid">
              {shopFilters.map(f => (
                <Link key={f.href} href={f.href} className="mobile-filter-link" onClick={() => setMenuOpen(false)}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mobile-menu-divider" />

          {/* Navigation */}
          <div className="mobile-menu-section">
            {user && (
              <Link href="/orders" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                📦 My Orders
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                ⚙️ Admin Panel
              </Link>
            )}
          </div>

          <div className="mobile-menu-divider" />

          {/* Auth */}
          <div className="mobile-menu-section">
            {user ? (
              <>
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">{user.name.charAt(0)}</div>
                  <div>
                    <div className="mobile-user-name">{user.name}</div>
                    <div className="mobile-user-email">{user.email}</div>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', marginTop: '12px' }} onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/login" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
