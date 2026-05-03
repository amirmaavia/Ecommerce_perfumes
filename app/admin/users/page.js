'use client';
// app/admin/users/page.js - Admin Customer Management
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
    setLoading(false);
  }

  async function handleRoleToggle(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${user.name}'s role to "${newRole}"?`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`${user.name}'s role updated to ${newRole}`);
      loadUsers();
    } else {
      toast(data.error, 'error');
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Delete customer "${user.name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`${user.name} deleted`);
      loadUsers();
    } else {
      toast(data.error, 'error');
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomers = users.filter(u => u.role !== 'admin').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
      Loading customers...
    </div>
  );

  return (
    <>
      <div className="admin-header">
        <h1>Customers</h1>
        <p>Manage registered users and their permissions</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { icon: '👥', label: 'Total Customers', value: totalCustomers, color: '#4CAF50' },
          { icon: '⚙️', label: 'Admin Users', value: totalAdmins, color: 'var(--gold)' },
          { icon: '📊', label: 'Total Registered', value: users.length, color: '#2196F3' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: '180px',
            background: 'var(--surface)', border: '1px solid var(--border-light)',
            borderRadius: '16px', padding: '20px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color, fontFamily: 'Cormorant Garamond,serif' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <input
            type="text"
            placeholder="🔍 Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Role</th>
              <th>Saved Addresses</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: u.role === 'admin'
                        ? 'rgba(201,169,110,0.2)'
                        : 'rgba(76,175,80,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0,
                    }}>
                      {u.role === 'admin' ? '⚙️' : '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {u.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</td>
                <td>
                  <span className={`status-badge ${u.role === 'admin' ? 'status-shipped' : 'status-delivered'}`}>
                    {u.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}
                  </span>
                </td>
                <td style={{ fontSize: '13px' }}>
                  {u.addresses?.length > 0 ? (
                    <div>
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{u.addresses.length}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> saved</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {u.addresses[0]?.city}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>None</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-PK', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRoleToggle(u)}
                      title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    >
                      {u.role === 'admin' ? '👤 Set User' : '⚙️ Set Admin'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  {search ? 'No customers match your search' : 'No customers registered yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
