'use client';
// app/login/page.js
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast(`Welcome back, ${user.name.split(' ')[0]}! 👑`);
      router.push(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>LUXE</h1>
          <p>Premium Fragrance House</p>
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
          Sign in to your account
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              id="login-email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              id="login-password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading} id="login-btn">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* <div style={{marginTop:'20px',textAlign:'center'}}>
          <div style={{padding:'12px',background:'rgba(201,169,110,0.08)',border:'1px solid var(--border)',borderRadius:'10px',marginBottom:'16px'}}>
            <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'6px'}}>🛡️ Admin Demo Account</div>
            <div style={{fontSize:'12px',color:'var(--gold)'}}>admin@luxe.com / admin123</div>
          </div>
        </div> */}

        <div className="auth-divider">
          <span>New to LUXE?</span>
        </div>

        <Link href="/register" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
          Create an Account
        </Link>
      </div>
    </div>
  );
}
