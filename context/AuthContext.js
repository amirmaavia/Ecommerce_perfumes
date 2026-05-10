'use client';
// context/AuthContext.js - Auth context with encrypted API communication
import { createContext, useContext, useState, useEffect } from 'react';
import { secureFetch } from '@/lib/clientCrypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  async function fetchMe() {
    try {
      const { ok, data } = await secureFetch('/api/auth/me');
      if (ok && data.user) {
        setUser(data.user);
      }
    } catch {}
    setLoading(false);
  }

  async function login(email, password) {
    const { ok, data } = await secureFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!ok) throw new Error(data.error);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { ok, data } = await secureFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!ok) throw new Error(data.error);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await secureFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
