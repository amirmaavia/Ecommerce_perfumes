'use client';
// app/admin/discounts/page.js
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { secureFetch } from '@/lib/clientCrypto';

const EMPTY_FORM = { code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', active: true };

export default function AdminDiscounts() {
  const toast = useToast();
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDiscounts(); }, []);

  async function loadDiscounts() {
    const { ok, data } = await secureFetch('/api/discounts');
    if (ok) {
      setDiscounts(data.discounts || []);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    const { ok, data } = await secureFetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (ok) {
      toast(`Discount "${data.discount.code}" created!`);
      setForm(EMPTY_FORM);
      loadDiscounts();
    } else toast(data.error, 'error');
    setLoading(false);
  }

  return (
    <>
      <div className="admin-header">
        <h1>Discounts</h1>
        <p>Create and manage promotional discount codes</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:'24px',alignItems:'start'}}>
        {/* Add Form */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border-light)',borderRadius:'20px',padding:'28px'}}>
          <h3 style={{fontSize:'1.1rem',marginBottom:'20px'}}>Create Discount Code</h3>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Discount Code *</label>
              <input
                id="disc-code"
                placeholder="LUXE20"
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                required
                style={{textTransform:'uppercase',letterSpacing:'2px',fontWeight:700}}
              />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Value *</label>
                <input
                  id="disc-value"
                  type="number"
                  placeholder={form.type === 'percentage' ? '20 (%)' : '500 (Rs.)'}
                  value={form.value}
                  onChange={e => setForm({...form, value: e.target.value})}
                  required min={0} max={form.type === 'percentage' ? 100 : undefined}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Order (Rs.)</label>
                <input
                  type="number"
                  placeholder="0 = no minimum"
                  value={form.minOrder}
                  onChange={e => setForm({...form, minOrder: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Uses</label>
                <input
                  type="number"
                  placeholder="0 = unlimited"
                  value={form.maxUses}
                  onChange={e => setForm({...form, maxUses: e.target.value})}
                />
              </div>
            </div>

            <div style={{marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
              <input type="checkbox" id="disc-active" checked={form.active} onChange={e => setForm({...form,active:e.target.checked})} style={{width:'auto'}} />
              <label htmlFor="disc-active" style={{color:'var(--text)',fontSize:'14px'}}>Active (can be used immediately)</label>
            </div>

            {/* Preview */}
            {form.code && form.value && (
              <div style={{background:'rgba(201,169,110,0.1)',border:'1px solid var(--border)',borderRadius:'10px',padding:'14px',marginBottom:'16px',fontSize:'13px'}}>
                <div style={{color:'var(--gold)',fontWeight:700,letterSpacing:'2px',marginBottom:'4px'}}>{form.code}</div>
                <div style={{color:'var(--text-muted)'}}>
                  {form.type === 'percentage' ? `${form.value}% off` : `Rs. ${form.value} off`}
                  {form.minOrder ? ` on orders over Rs. ${form.minOrder}` : ''}
                  {form.maxUses ? ` · ${form.maxUses} uses max` : ' · Unlimited uses'}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading} id="add-disc-btn">
              {loading ? 'Creating...' : '+ Create Discount Code'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="table-wrap">
          <div className="table-header">
            <h3 style={{fontSize:'1rem'}}>Active Discount Codes</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Used/Max</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id}>
                  <td style={{fontFamily:'monospace',fontWeight:700,color:'var(--gold)',letterSpacing:'1px'}}>{d.code}</td>
                  <td style={{fontSize:'13px',textTransform:'capitalize'}}>{d.type}</td>
                  <td style={{fontSize:'13px',fontWeight:600}}>
                    {d.type === 'percentage' ? `${d.value}%` : `Rs. ${d.value.toLocaleString()}`}
                  </td>
                  <td style={{fontSize:'12px',color:'var(--text-muted)'}}>
                    {d.minOrder > 0 ? `Rs. ${d.minOrder.toLocaleString()}` : 'None'}
                  </td>
                  <td style={{fontSize:'13px'}}>
                    <span style={{color:'var(--gold)'}}>{d.usedCount}</span>
                    <span style={{color:'var(--text-dim)'}}> / {d.maxUses > 0 ? d.maxUses : '∞'}</span>
                  </td>
                  <td>
                    <span className={d.active ? 'status-badge status-delivered' : 'status-badge status-cancelled'}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:'40px'}}>
                  No discount codes yet. Create your first one!
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
