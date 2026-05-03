'use client';
// app/register/page.js
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password);
      toast(`Welcome to LUXE, ${user.name.split(' ')[0]}! 🎉`);
      router.push('/shop');
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
          <p>Join the fragrance community</p>
        </div>

        <h2 style={{fontSize:'1.8rem',marginBottom:'8px',textAlign:'center'}}>Create Account</h2>
        <p style={{color:'var(--text-muted)',fontSize:'14px',textAlign:'center',marginBottom:'32px'}}>
          Join LUXE Club and get 20% off your first order
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              id="reg-name"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              id="reg-email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              id="reg-password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              id="reg-confirm"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => setForm({...form, confirm: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%',padding:'14px',fontSize:'15px'}} disabled={loading} id="reg-btn">
            {loading ? 'Creating Account...' : 'Create My Account →'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'12px',color:'var(--text-dim)',marginTop:'16px'}}>
          By registering, you agree to our Terms & Privacy Policy
        </p>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <Link href="/login" className="btn btn-outline" style={{width:'100%',textAlign:'center'}}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
