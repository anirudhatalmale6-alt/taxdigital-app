import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

/* ── Helpers ─────────────────────────────────────────────────────── */
const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const today = () => new Date().toISOString().slice(0, 10);

/* ── Account type config ─────────────────────────────────────────── */
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

const TYPE_COLORS = {
  ASSET:     { bg: '#e8f0fe', text: '#1a56db', border: '#1a56db' },
  LIABILITY: { bg: '#fce8e8', text: '#dc2626', border: '#dc2626' },
  EQUITY:    { bg: '#e6f9e8', text: '#059669', border: '#059669' },
  INCOME:    { bg: '#fff7e6', text: '#d97706', border: '#d97706' },
  EXPENSE:   { bg: '#f3e8ff', text: '#7c3aed', border: '#7c3aed' },
};

const SUB_TYPES = {
  ASSET:     ['Current Asset', 'Fixed Asset', 'Bank', 'Other Asset'],
  LIABILITY: ['Current Liability', 'Long-Term Liability', 'Other Liability'],
  EQUITY:    ['Equity', 'Retained Earnings', 'Owner Equity'],
  INCOME:    ['Revenue', 'Other Income', 'Sales'],
  EXPENSE:   ['Direct Cost', 'Operating Expense', 'Overhead', 'Other Expense'],
};

const EMPTY_FORM = {
  code: '',
  name: '',
  type: 'ASSET',
  subType: '',
};

/* ══════════════════════════════════════════════════════════════════
   Chart of Accounts Page
   ══════════════════════════════════════════════════════════════════ */
export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asAt, setAsAt] = useState(today);

  /* ── Modal state ───────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* ── Fetch accounts ────────────────────────────────────────────── */
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/accounts?asAt=${asAt}`);
      setAccounts(res.accounts || []);
      setTotals(res.totals || { debit: 0, credit: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [asAt]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  /* ── Group accounts by type ────────────────────────────────────── */
  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = accounts.filter(
      (a) => (a.type || '').toUpperCase() === type
    );
    return acc;
  }, {});

  /* ── Modal helpers ─────────────────────────────────────────────── */
  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
      setFormError(null);
    }
  }

  function handleFormChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset subType when type changes
      if (field === 'type') {
        next.subType = '';
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Code and Name are required.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      await api.post('/accounts', {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        subType: form.subType || undefined,
      });
      setModalOpen(false);
      fetchAccounts();
    } catch (err) {
      setFormError(err.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Chart of Accounts</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Account
        </button>
      </div>

      {/* ── Date picker ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div className="filter-group">
            <label className="filter-label">As at date</label>
            <input
              type="date"
              className="input"
              value={asAt}
              onChange={(e) => setAsAt(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchAccounts}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="card error-card" style={{ marginBottom: '1.5rem' }}>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchAccounts}>Retry</button>
        </div>
      )}

      {/* ── Accounts table ───────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading accounts...</p>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📒</div>
          <h3>No accounts found</h3>
          <p className="text-muted">Add your first account to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openAdd}>
            + Add Account
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Code</th>
                  <th>Account Name</th>
                  <th style={{ width: '120px' }}>Type</th>
                  <th className="text-right" style={{ width: '140px' }}>Debit (£)</th>
                  <th className="text-right" style={{ width: '140px' }}>Credit (£)</th>
                  <th className="text-right" style={{ width: '140px' }}>Balance (£)</th>
                </tr>
              </thead>
              <tbody>
                {ACCOUNT_TYPES.map((type) => {
                  const items = grouped[type];
                  if (items.length === 0) return null;
                  const colors = TYPE_COLORS[type];
                  return (
                    <React.Fragment key={type}>
                      {/* Section header */}
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            letterSpacing: '0.04em',
                            borderLeft: `4px solid ${colors.border}`,
                            padding: '10px 16px',
                          }}
                        >
                          {type}
                        </td>
                      </tr>
                      {/* Account rows */}
                      {items.map((acct) => (
                        <tr key={acct.id || acct.code}>
                          <td style={{ fontWeight: 600 }}>{acct.code}</td>
                          <td>
                            {acct.name}
                            {acct.sub_type && (
                              <span className="text-muted text-sm" style={{ marginLeft: '8px' }}>
                                ({acct.sub_type})
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                              }}
                            >
                              {acct.type}
                            </span>
                          </td>
                          <td className="text-right">{formatGBP(acct.total_debit)}</td>
                          <td className="text-right">{formatGBP(acct.total_credit)}</td>
                          <td className="text-right" style={{ fontWeight: 600 }}>
                            {formatGBP(acct.balance)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {/* Totals row */}
                <tr style={{ backgroundColor: 'var(--color-bg)', fontWeight: 700 }}>
                  <td colSpan={3} style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Total
                  </td>
                  <td className="text-right" style={{ fontWeight: 700 }}>
                    {formatGBP(totals.debit)}
                  </td>
                  <td className="text-right" style={{ fontWeight: 700 }}>
                    {formatGBP(totals.credit)}
                  </td>
                  <td className="text-right" style={{ fontWeight: 700 }}>
                    {formatGBP((totals.debit || 0) - (totals.credit || 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Account Modal ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Account</h3>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Account Code *</label>
                <input
                  type="text"
                  className="input"
                  value={form.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Name *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Cash in Bank"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sub-Type</label>
                <select
                  className="input"
                  value={form.subType}
                  onChange={(e) => handleFormChange('subType', e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {(SUB_TYPES[form.type] || []).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
