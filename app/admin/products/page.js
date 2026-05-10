'use client';
// app/admin/products/page.js
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { secureFetch } from '@/lib/clientCrypto';

const EMPTY_FORM = {
  name: '', category: '', price: '', originalPrice: '',
  stock: '', description: '', size: '100ml',
  featured: false, image: '',
  images: [''],
  notes: { top: '', heart: '', base: '' },
  variants: [],
};

const EMPTY_VARIANT = { size: '100ml', price: '', originalPrice: '', stock: '', images: [''] };

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState({}); // { slotIdx: true/false }
  const [deletingId, setDeletingId] = useState(null); // id being confirmed for delete
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRefs = useRef({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [prodRes, catRes] = await Promise.all([
      secureFetch('/api/products'),
      secureFetch('/api/categories'),
    ]);
    setProducts(prodRes.data.products || []);
    setCategories(catRes.data.categories || []);
  }

  function openAdd() {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, images: [''], notes: { top: '', heart: '', base: '' } });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditProduct(p);
    setForm({
      name: p.name, category: p.category, price: p.price,
      originalPrice: p.originalPrice, stock: p.stock,
      description: p.description, size: p.size, featured: p.featured,
      image: p.image || '',
      images: p.images && p.images.length > 0 ? [...p.images] : [p.image || ''],
      notes: p.notes || { top: '', heart: '', base: '' },
      variants: p.variants && p.variants.length > 0
        ? p.variants.map(v => ({ ...v, images: v.images && v.images.length > 0 ? [...v.images] : [''] }))
        : [],
    });
    setShowModal(true);
  }

  // Upload a picked file to the server, update a specific slot
  async function handleFilePick(idx, file) {
    if (!file) return;
    setUploading(prev => ({ ...prev, [idx]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Upload failed', 'error'); return; }
      updateImageSlot(idx, data.url);
      toast('Image uploaded! ✅');
    } catch {
      toast('Upload failed', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [idx]: false }));
    }
  }

  function updateImageSlot(idx, val) {
    const newImages = [...form.images];
    newImages[idx] = val;
    setForm(prev => ({ ...prev, images: newImages, image: idx === 0 ? val : prev.image }));
  }

  function addImageSlot() {
    setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  }

  function removeImageSlot(idx) {
    if (form.images.length <= 1) return;
    const newImages = form.images.filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, images: newImages, image: newImages[0] || '' }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanImages = form.images.filter(img => img.trim() !== '');
      // Clean variant images too
      const cleanVariants = form.variants.map(v => ({
        ...v,
        price: parseFloat(v.price) || 0,
        originalPrice: parseFloat(v.originalPrice) || parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
        images: (v.images || []).filter(img => img.trim() !== ''),
      }));
      // Auto-sync main product with first variant if variants exist
      let mainPrice = form.price;
      let mainOrigPrice = form.originalPrice;
      let mainStock = form.stock;
      let mainSize = form.size;
      if (cleanVariants.length > 0) {
        const first = cleanVariants[0];
        mainPrice = first.price;
        mainOrigPrice = first.originalPrice;
        mainStock = first.stock;
        mainSize = first.size;
      }
      const payload = {
        ...form,
        price: mainPrice,
        originalPrice: mainOrigPrice,
        stock: mainStock,
        size: mainSize,
        image: cleanImages[0] || '/images/perfume1.jpg',
        images: cleanImages.length > 0 ? cleanImages : ['/images/perfume1.jpg'],
        variants: cleanVariants,
      };
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const { ok, data } = await secureFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!ok) { toast(data.error, 'error'); }
      else {
        toast(editProduct ? 'Product updated!' : 'Product added!');
        setShowModal(false);
        loadData();
      }
    } catch { toast('Failed to save product', 'error'); }
    setLoading(false);
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      const { ok, data } = await secureFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (ok) {
        toast('Product deleted successfully 🗑️');
        setDeletingId(null);
        loadData();
      } else {
        toast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      toast('Network error — could not delete', 'error');
    }
    setDeleteLoading(false);
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const catName = (id) => categories.find(c => c.id === id)?.name || '-';

  return (
    <>
      <div className="admin-header">
        <h1>Products</h1>
        <p>Manage your fragrance inventory</p>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={openAdd} id="add-product-btn">
            + Add Product
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px', height: '56px', borderRadius: '8px', overflow: 'hidden',
                      background: 'var(--dark3)', border: '1px solid var(--border)',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.image ? (
                        <img
                          src={p.image} alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        />
                      ) : null}
                      <span style={{ fontSize: '20px', display: p.image ? 'none' : 'block' }}>🧴</span>
                    </div>
                    <div>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {p.variants && p.variants.length > 1
                          ? p.variants.map(v => v.size).join(' · ')
                          : p.size
                        }
                      </div>
                      {p.images && p.images.length > 1 && (
                        <div style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '2px' }}>
                          📷 {p.images.length} photos
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '13px' }}>{catName(p.category)}</td>
                <td>
                  <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '13px' }}>Rs. {p.price.toLocaleString()}</div>
                  {p.originalPrice > p.price && (
                    <div style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--text-dim)' }}>Rs. {p.originalPrice.toLocaleString()}</div>
                  )}
                </td>
                <td>
                  <span style={{
                    color: p.stock === 0 ? 'var(--error)' : p.stock < 10 ? 'var(--warning)' : 'var(--success)',
                    fontWeight: 700, fontSize: '13px',
                  }}>{p.stock}</span>
                  {p.stock < 10 && p.stock > 0 && <span style={{ fontSize: '10px', color: 'var(--warning)', display: 'block' }}>Low stock</span>}
                </td>
                <td>
                  <span style={{ color: p.featured ? 'var(--gold)' : 'var(--text-dim)', fontSize: '13px' }}>
                    {p.featured ? '⭐ Yes' : '—'}
                  </span>
                </td>
                <td>
                  {deletingId === p.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.25)', borderRadius: '10px', padding: '6px 10px' }}>
                      <span style={{ fontSize: '12px', color: '#ff6b6b', whiteSpace: 'nowrap' }}>Delete "{p.name}"?</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteLoading}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        {deleteLoading ? '...' : '✓ Yes'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeletingId(null)}
                        disabled={deleteLoading}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        ✗ No
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingId(p.id)}
                        title="Delete product"
                      >🗑️ Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== ADD / EDIT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>

            {/* Sticky header */}
            <div className="modal-header" style={{
              position: 'sticky', top: 0, background: 'var(--dark2)', zIndex: 10,
              borderRadius: '20px 20px 0 0', padding: '20px 28px', borderBottom: '1px solid var(--border-light)',
            }}>
              <h2>{editProduct ? '✏️ Edit Product' : '+ Add New Product'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px 28px 28px' }}>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input placeholder="Oud Royal Noir" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>

              {/* Grid fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Size</label>
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                    {['30ml', '50ml', '75ml', '100ml', '150ml', '200ml'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Price (Rs.) *</label>
                  <input type="number" placeholder="4999" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price (Rs.)</label>
                  <input type="number" placeholder="6499" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Stock *</label>
                  <input type="number" placeholder="50" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '28px' }}>
                  <input type="checkbox" id="prod-featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} style={{ width: 'auto' }} />
                  <label htmlFor="prod-featured" style={{ fontSize: '14px', color: 'var(--text)', textTransform: 'none', letterSpacing: 'normal' }}>Featured Product</label>
                </div>
              </div>

              {/* ===== SIZE VARIANTS SECTION ===== */}
              <div style={{
                background: 'var(--dark3)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '18px', marginBottom: '20px', marginTop: '10px',
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
                  color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>📦 Size Variants <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0 }}>— Different price/stock/images per size</span></span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, variants: [...prev.variants, { ...EMPTY_VARIANT }] }))}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', color: 'var(--gold)', padding: '4px 12px' }}
                  >+ Add Size</button>
                </div>

                {form.variants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    No variants — product uses default price/stock above.<br />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, variants: [{ size: form.size || '100ml', price: form.price || '', originalPrice: form.originalPrice || '', stock: form.stock || '', images: [''] }] }))}
                      style={{ marginTop: '10px', fontSize: '12px', color: 'var(--gold)', background: 'none', border: '1px dashed var(--gold)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                    >+ Create First Variant from Defaults</button>
                  </div>
                ) : (
                  form.variants.map((v, vi) => (
                    <div key={vi} style={{
                      background: 'var(--dark2)', border: '1px solid var(--border-light)', borderRadius: '12px',
                      padding: '16px', marginBottom: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>Variant #{vi + 1}</span>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== vi) }))}
                          style={{ fontSize: '11px', color: '#E53935', background: 'none', border: '1px solid rgba(229,57,53,0.3)', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}
                        >✕ Remove</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '10px' }}>Size</label>
                          <select
                            value={v.size}
                            onChange={e => {
                              const newVars = [...form.variants];
                              newVars[vi] = { ...newVars[vi], size: e.target.value };
                              setForm(prev => ({ ...prev, variants: newVars }));
                            }}
                            style={{ fontSize: '12px', padding: '8px' }}
                          >
                            {['30ml','50ml','75ml','100ml','150ml','200ml'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '10px' }}>Price (Rs.)</label>
                          <input
                            type="number" placeholder="4999" style={{ fontSize: '12px', padding: '8px' }}
                            value={v.price}
                            onChange={e => {
                              const newVars = [...form.variants];
                              newVars[vi] = { ...newVars[vi], price: e.target.value };
                              setForm(prev => ({ ...prev, variants: newVars }));
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '10px' }}>Original Price</label>
                          <input
                            type="number" placeholder="6499" style={{ fontSize: '12px', padding: '8px' }}
                            value={v.originalPrice}
                            onChange={e => {
                              const newVars = [...form.variants];
                              newVars[vi] = { ...newVars[vi], originalPrice: e.target.value };
                              setForm(prev => ({ ...prev, variants: newVars }));
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '10px' }}>Stock</label>
                          <input
                            type="number" placeholder="50" style={{ fontSize: '12px', padding: '8px' }}
                            value={v.stock}
                            onChange={e => {
                              const newVars = [...form.variants];
                              newVars[vi] = { ...newVars[vi], stock: e.target.value };
                              setForm(prev => ({ ...prev, variants: newVars }));
                            }}
                          />
                        </div>
                      </div>
                      {/* Variant images */}
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>📷 Variant Images</div>
                        {(v.images || ['']).map((img, imgIdx) => (
                          <div key={imgIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', background: 'var(--dark3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '14px', opacity: 0.3 }}>🖼️</span>}
                            </div>
                            <input
                              placeholder={`Image ${imgIdx + 1} URL`}
                              value={img}
                              onChange={e => {
                                const newVars = [...form.variants];
                                const newImgs = [...(newVars[vi].images || [''])];
                                newImgs[imgIdx] = e.target.value;
                                newVars[vi] = { ...newVars[vi], images: newImgs };
                                setForm(prev => ({ ...prev, variants: newVars }));
                              }}
                              style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
                            />
                            {(v.images || []).length > 1 && (
                              <button type="button" onClick={() => {
                                const newVars = [...form.variants];
                                newVars[vi] = { ...newVars[vi], images: newVars[vi].images.filter((_, i) => i !== imgIdx) };
                                setForm(prev => ({ ...prev, variants: newVars }));
                              }} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid rgba(229,57,53,0.3)', background: 'rgba(229,57,53,0.08)', color: '#E53935', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newVars = [...form.variants];
                          newVars[vi] = { ...newVars[vi], images: [...(newVars[vi].images || ['']), ''] };
                          setForm(prev => ({ ...prev, variants: newVars }));
                        }} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: '1px dashed var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', marginTop: '2px' }}>+ Add Image</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="Describe the fragrance..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>

              {/* ===== IMAGES SECTION ===== */}
              <div style={{
                background: 'var(--dark3)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '18px', marginBottom: '20px',
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
                  color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  📷 Product Images
                  <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0 }}>
                    — First image is the main card photo
                  </span>
                </div>

                {form.images.map((img, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

                      {/* Thumbnail preview */}
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden',
                        background: 'var(--dark2)', border: `1px solid ${idx === 0 ? 'var(--gold)' : 'var(--border)'}`,
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        {uploading[idx] ? (
                          <div style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>⏳</div>
                        ) : img ? (
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '22px', opacity: 0.3 }}>🖼️</span>
                        )}
                        {idx === 0 && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(201,169,110,0.85)', color: '#000',
                            fontSize: '8px', fontWeight: 700, textAlign: 'center', padding: '2px',
                          }}>MAIN</div>
                        )}
                      </div>

                      {/* URL input (editable) */}
                      <input
                        placeholder={idx === 0 ? 'Main image URL or pick from PC →' : `Extra image ${idx + 1} URL`}
                        value={img}
                        onChange={e => updateImageSlot(idx, e.target.value)}
                        style={{
                          flex: 1,
                          borderColor: idx === 0 ? 'rgba(201,169,110,0.4)' : undefined,
                          fontSize: '13px',
                        }}
                      />

                      {/* 📁 Pick from PC button */}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={el => fileInputRefs.current[idx] = el}
                        onChange={e => handleFilePick(idx, e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        title="Pick image from your PC"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={uploading[idx]}
                        style={{
                          display: 'flex', flexShrink: 0,
                          alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '10px 14px', borderRadius: '10px',
                          border: '1px solid var(--gold)', background: 'rgba(201,169,110,0.1)',
                          color: 'var(--gold)', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'all 0.2s', opacity: uploading[idx] ? 0.5 : 1,
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(201,169,110,0.25)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(201,169,110,0.1)'}
                      >
                        📁 Browse
                      </button>

                      {/* Remove slot */}
                      {form.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageSlot(idx)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                            border: '1px solid rgba(229,57,53,0.3)', background: 'rgba(229,57,53,0.08)',
                            color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '14px',
                          }}
                        >✕</button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add slot */}
                <button
                  type="button"
                  onClick={addImageSlot}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px dashed var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', marginTop: '4px',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  + Add Another Image Slot
                </button>

                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '10px' }}>
                  Click <strong style={{ color: 'var(--gold)' }}>📁 Browse</strong> to pick images from your PC (JPG, PNG, WebP — max 5MB each).
                  You can also paste a URL directly into the field.
                </p>
              </div>

              {/* Fragrance Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Top Notes</label>
                  <input placeholder="Saffron, Bergamot" value={form.notes?.top || ''} onChange={e => setForm({ ...form, notes: { ...form.notes, top: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Heart Notes</label>
                  <input placeholder="Oud, Rose" value={form.notes?.heart || ''} onChange={e => setForm({ ...form, notes: { ...form.notes, heart: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Base Notes</label>
                  <input placeholder="Musk, Amber" value={form.notes?.base || ''} onChange={e => setForm({ ...form, notes: { ...form.notes, base: e.target.value } })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} id="save-product-btn">
                  {loading ? 'Saving...' : (editProduct ? '✓ Update Product' : '+ Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
