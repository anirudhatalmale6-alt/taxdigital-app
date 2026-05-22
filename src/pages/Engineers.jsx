import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const PRESET_COLORS = [
  '#1a56db', '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#4f46e5',
  '#0d9488', '#b91c1c',
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  colour: '#1a56db',
};

export default function Engineers() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch ────────────────────────────────────────────────────────── */
  const fetchEngineers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/engineers');
      setEngineers(res.engineers || []);
    } catch (err) {
      setError(err.message || 'Failed to load engineers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEngineers(); }, [fetchEngineers]);

  /* ── Modal helpers ────────────────────────────────────────────────── */
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(eng) {
    setEditing(eng);
    setForm({
      name: eng.name || '',
      email: eng.email || '',
      phone: eng.phone || '',
      colour: eng.colour || eng.color || '#1a56db',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required'); return; }

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      colour: form.colour,
    };

    try {
      setSaving(true);
      setFormError(null);
      if (editing) {
        await api.put(`/engineers/${editing.id}`, body);
      } else {
        await api.post('/engineers', body);
      }
      closeModal();
      fetchEngineers();
    } catch (err) {
      setFormError(err.message || 'Failed to save engineer');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(eng) {
    try {
      await api.put(`/engineers/${eng.id}`, { is_active: !eng.is_active });
      fetchEngineers();
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/engineers/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchEngineers();
    } catch (err) {
      setFormError(err.message || 'Failed to delete engineer');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Engineers</h1>
          {!loading && (
            <span className="badge badge--neutral" style={{ fontSize: '0.78rem' }}>
              {engineers.length} total
            </span>
          )}
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Engineer
          </button>
        </div>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div className="page-loader__spinner" style={{ margin: '0 auto 12px' }} />
          Loading engineers...
        </div>
      ) : engineers.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="empty-state__title">No engineers yet</h3>
          <p className="empty-state__text">Add your first engineer to start scheduling jobs.</p>
          <button className="btn btn--primary" onClick={openAdd}>Add Engineer</button>
        </div>
      ) : (
        /* Card grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {engineers.map((eng) => (
            <div key={eng.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Color bar */}
              <div style={{ height: 4, background: eng.colour || eng.color || '#6b7280' }} />

              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Color avatar */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: eng.colour || eng.color || '#6b7280',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      flexShrink: 0,
                    }}>
                      {eng.name ? eng.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {eng.name}
                      </h3>
                      <span className={`badge ${eng.is_active ? 'badge--success' : 'badge--neutral'}`} style={{ marginTop: 2 }}>
                        {eng.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {eng.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {eng.email}
                    </div>
                  )}
                  {eng.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {eng.phone}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: eng.colour || eng.color || '#6b7280',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }} />
                    {eng.colour || eng.color || '#6b7280'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border-light)', paddingTop: 14 }}>
                  <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => openEdit(eng)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button
                    className={`btn btn--sm ${eng.is_active ? 'btn--ghost' : 'btn--secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => toggleActive(eng)}
                  >
                    {eng.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setDeleteTarget(eng)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? 'Edit Engineer' : 'Add Engineer'}</h3>
              <button className="modal__close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal__body">
                {formError && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{formError}</div>}

                <div className="form-group">
                  <label className="form-label form-label--required">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Full name" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="+44 7000 000000" />
                  </div>
                </div>

                {/* Color picker */}
                <div className="form-group">
                  <label className="form-label">Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <input
                      type="color"
                      value={form.colour}
                      onChange={(e) => updateForm('colour', e.target.value)}
                      style={{ width: 40, height: 36, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: 2 }}
                    />
                    <input
                      className="form-input"
                      value={form.colour}
                      onChange={(e) => updateForm('colour', e.target.value)}
                      placeholder="#1a56db"
                      style={{ maxWidth: 120 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateForm('colour', c)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: c,
                          border: form.colour === c ? '3px solid var(--color-text)' : '2px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'transform var(--transition)',
                        }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Delete Engineer</h3>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? Any jobs assigned to this engineer will be unassigned.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
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
