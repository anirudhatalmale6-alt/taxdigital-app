import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const PRODUCT_TYPES = ['Inventory', 'Service', 'Non-Stock'];
const VAT_RATES = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '20', label: '20%' },
];

const EMPTY_FORM = {
  name: '',
  sku: '',
  description: '',
  type: 'Inventory',
  price: '',
  cost: '',
  vatRate: '20',
  stockQty: '0',
  trackInventory: true,
  barcode: '',
  category: '',
};

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch products ───────────────────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('type', typeFilter);
      const qs = params.toString();
      const res = await api.get(`/products${qs ? `?${qs}` : ''}`);
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Modal helpers ────────────────────────────────────────────────── */
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      type: product.type || 'Inventory',
      price: product.price != null ? String(product.price) : '',
      cost: product.cost != null ? String(product.cost) : '',
      vatRate: product.vat_rate != null ? String(product.vat_rate) : '20',
      stockQty: product.stock_qty != null ? String(product.stock_qty) : '0',
      trackInventory: product.track_inventory !== false,
      barcode: product.barcode || '',
      category: product.category || '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  /* ── Save (create / update) ───────────────────────────────────────── */
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const body = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        type: form.type,
        price: form.price !== '' ? parseFloat(form.price) : 0,
        cost: form.cost !== '' ? parseFloat(form.cost) : 0,
        vatRate: parseFloat(form.vatRate),
        stockQty: parseInt(form.stockQty, 10) || 0,
        trackInventory: form.trackInventory,
        barcode: form.barcode.trim(),
        category: form.category.trim(),
      };

      if (editing) {
        await api.put(`/products/${editing.id}`, body);
      } else {
        await api.post('/products', body);
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete handler ───────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Type badge styling ───────────────────────────────────────────── */
  function typeBadgeClass(type) {
    switch (type) {
      case 'Inventory': return 'badge--info';
      case 'Service': return 'badge--success';
      case 'Non-Stock': return 'badge--neutral';
      default: return 'badge--neutral';
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search products by name, SKU or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: '0 0 180px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert--danger" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
          <button className="btn btn--primary btn--sm" onClick={fetchProducts} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="page-loader__spinner" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <h3 className="empty-state__title">No products found</h3>
            <p className="empty-state__text">
              {search.trim() || typeFilter
                ? 'Try adjusting your search or filters.'
                : 'Add your first product to get started.'}
            </p>
            {!search.trim() && !typeFilter && (
              <button className="btn btn--primary" onClick={openAdd}>+ Add Product</button>
            )}
          </div>
        </div>
      ) : (
        <div className="card card--flush">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Price</th>
                  <th>VAT Rate</th>
                  <th className="text-right">Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.sku || '—'}</td>
                    <td>
                      <span className={`badge ${typeBadgeClass(p.type)}`}>
                        {p.type || '—'}
                      </span>
                    </td>
                    <td className="text-right">{formatGBP(p.cost)}</td>
                    <td className="text-right">{formatGBP(p.price)}</td>
                    <td>{p.vat_rate != null ? `${p.vat_rate}%` : '—'}</td>
                    <td className="text-right">{p.track_inventory !== false ? (p.stock_qty ?? 0) : '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => setDeleteTarget(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {editing ? 'Edit Product' : 'Add Product'}
              </h3>
              <button className="modal__close" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal__body">
                {formError && (
                  <div className="alert alert--danger" style={{ marginBottom: '16px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      className="form-input"
                      value={form.sku}
                      onChange={handleFormChange}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Product description"
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      name="type"
                      className="form-select"
                      value={form.type}
                      onChange={handleFormChange}
                    >
                      {PRODUCT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      name="category"
                      className="form-input"
                      value={form.category}
                      onChange={handleFormChange}
                      placeholder="e.g. Electronics"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost (£)</label>
                    <input
                      type="number"
                      name="cost"
                      className="form-input"
                      value={form.cost}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sell Price (£)</label>
                    <input
                      type="number"
                      name="price"
                      className="form-input"
                      value={form.price}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">VAT Rate</label>
                    <select
                      name="vatRate"
                      className="form-select"
                      value={form.vatRate}
                      onChange={handleFormChange}
                    >
                      {VAT_RATES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      name="stockQty"
                      className="form-input"
                      value={form.stockQty}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      className="form-input"
                      value={form.barcode}
                      onChange={handleFormChange}
                      placeholder="Barcode / EAN"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-check">
                    <input
                      type="checkbox"
                      name="trackInventory"
                      checked={form.trackInventory}
                      onChange={handleFormChange}
                    />
                    <span className="text-sm">Track inventory for this product</span>
                  </label>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Delete Product</h3>
              <button className="modal__close" onClick={() => !deleting && setDeleteTarget(null)}>&times;</button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
