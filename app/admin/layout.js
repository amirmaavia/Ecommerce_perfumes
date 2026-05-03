'use client';
// app/admin/layout.js
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '🧴' },
  { href: '/admin/categories', label: 'Categories', icon: '📂' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/discounts', label: 'Discounts', icon: '🏷️' },
  { href: '/admin/users', label: 'Customers', icon: '👥' },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',color:'var(--text-muted)'}}>
        <div style={{fontSize:'48px'}}>🔐</div>
        <p style={{marginTop:'12px'}}>Verifying access...</p>
      </div>
    </div>
  );

  if (user.role !== 'admin') return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{marginBottom:'32px',padding:'0 8px'}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'1.3rem',color:'var(--gold)',marginBottom:'4px'}}>
            ⚙️ Admin Panel
          </div>
          <div style={{fontSize:'12px',color:'var(--text-muted)'}}>LUXE Parfums</div>
        </div>

        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-sidebar-link ${(item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)) ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <div style={{marginTop:'auto',borderTop:'1px solid var(--border-light)',paddingTop:'20px',marginTop:'40px'}}>
          <Link href="/" className="admin-sidebar-link">
            <span>🏪</span>
            <span>View Store</span>
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
