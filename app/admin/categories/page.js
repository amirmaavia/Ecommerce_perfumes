'use client';
// app/admin/categories/page.js
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { secureFetch } from '@/lib/clientCrypto';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCats(); }, []);

  async function loadCats() {
    const { data } = await secureFetch('/api/categories');
    setCategories(data.categories || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    const { ok, data } = await secureFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (ok) {
      toast(`Category "${form.name}" added!`);
      setForm({ name: '', description: '' });
      loadCats();
    } else toast(data.error, 'error');
    setLoading(false);
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete category "${name}"? This does NOT delete products in it.`)) return;
    const { ok } = await secureFetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (ok) { toast('Category deleted'); loadCats(); }
    else toast('Failed to delete', 'error');
  }

  const catIcons = ['🌿', '🌹', '🍋', '💎', '🌸', '🌊', '🔥', '🌙'];

  return (
    <>
      <div className="admin-header">
        <h1>Categories</h1>
        <p>Manage perfume types and categories</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:'24px',alignItems:'start'}}>
        {/* Add Form */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border-light)',borderRadius:'20px',padding:'28px'}}>
          <h3 style={{fontSize:'1.1rem',marginBottom:'20px'}}>Add New Category</h3>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                id="cat-name"
                placeholder="e.g. Woody, Oriental, Fresh..."
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={3}
                placeholder="Short description of this fragrance type..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                style={{resize:'vertical'}}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading} id="add-cat-btn">
              {loading ? 'Adding...' : '+ Add Category'}
            </button>
          </form>
        </div>

        {/* List */}
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px'}}>
            {categories.map((cat, i) => (
              <div key={cat.id} style={{
                background:'var(--surface)',
                border:'1px solid var(--border-light)',
                borderRadius:'16px',
                padding:'20px',
                position:'relative',
                transition:'all 0.2s',
              }}>
                <div style={{fontSize:'2rem',marginBottom:'12px'}}>{catIcons[i % catIcons.length]}</div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:'1.3rem',marginBottom:'6px'}}>{cat.name}</div>
                <div style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:'1.5',marginBottom:'16px'}}>{cat.description || 'No description'}</div>
                <div style={{display:'flex',justifyContent:'end'}}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(cat.id, cat.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <h3>No categories yet</h3>
              <p>Add your first category to organize products</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
