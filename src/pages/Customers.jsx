import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  vatNumber: '',
  contactPerson: '',
};

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch customers ──────────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      const qs = params.toString();
      const res = await api.get(`/customers${qs ? `?${qs}` : ''}`);
      setCustomers(res.customers || []);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ── Modal helpers ────────────────────────────────────────────────── */
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(customer) {
    setEditing(customer);
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      vatNumber: customer.vat_number || '',
      contactPerson: customer.contact_person || '',
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* ── Save (create / update) ───────────────────────────────────────── */
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        vatNumber: form.vatNumber.trim(),
        contactPerson: form.contactPerson.trim(),
      };

      if (editing) {
        await api.put(`/customers/${editing.id}`, body);
      } else {
        await api.post('/customers', body);
      }

      closeModal();
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete handler ───────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/customers/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="search-bar" style={{ maxWidth: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search customers by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '14px' }}
          />
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert--danger" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
          <button className="btn btn--primary btn--sm" onClick={fetchCustomers} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="page-loader__spinner" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">👥</div>
            <h3 className="empty-state__title">No customers found</h3>
            <p className="empty-state__text">
              {search.trim()
                ? 'Try adjusting your search query.'
                : 'Add your first customer to get started.'}
            </p>
            {!search.trim() && (
              <button className="btn btn--primary" onClick={openAdd}>+ Add Customer</button>
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
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Contact Person</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.contact_person || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => setDeleteTarget(c)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {editing ? 'Edit Customer' : 'Add Customer'}
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

                <div className="form-group">
                  <label className="form-label form-label--required">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Customer name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-input"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-textarea"
                    value={form.address}
                    onChange={handleFormChange}
                    placeholder="Full address"
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">VAT Number</label>
                    <input
                      type="text"
                      name="vatNumber"
                      className="form-input"
                      value={form.vatNumber}
                      onChange={handleFormChange}
                      placeholder="GB123456789"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      className="form-input"
                      value={form.contactPerson}
                      onChange={handleFormChange}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Customer' : 'Add Customer'}
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
              <h3 className="modal__title">Delete Customer</h3>
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
