import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

/* ── Confirm dialog ───────────────────────────────────────────────── */
function ConfirmDialog({ open, title, message, onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal__body">
          <p>{message}</p>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Account form modal ──────────────────────────────────────────── */
const EMPTY_FORM = {
  accountName: '',
  bankName: '',
  accountNumber: '',
  sortCode: '',
  iban: '',
  swiftBic: '',
  currency: 'GBP',
  openingBalance: '',
  isDefault: false,
};

function AccountFormModal({ open, account, onClose, onSaved }) {
  const isEdit = !!account;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account) {
      setForm({
        accountName: account.account_name || '',
        bankName: account.bank_name || '',
        accountNumber: account.account_number || '',
        sortCode: account.sort_code || '',
        iban: account.iban || '',
        swiftBic: account.swift_bic || '',
        currency: account.currency || 'GBP',
        openingBalance: account.opening_balance ?? '',
        isDefault: !!account.is_default,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [account, open]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.accountName.trim()) {
      setError('Account name is required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const body = {
        accountName: form.accountName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        sortCode: form.sortCode.trim(),
        iban: form.iban.trim(),
        swiftBic: form.swiftBic.trim(),
        currency: form.currency || 'GBP',
        openingBalance: form.openingBalance !== '' ? Number(form.openingBalance) : 0,
        isDefault: form.isDefault,
      };

      if (isEdit) {
        await api.put(`/bank-accounts/${account.id}`, body);
      } else {
        await api.post('/bank-accounts', body);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{isEdit ? 'Edit Account' : 'Add Bank Account'}</h3>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label--required">Account Name</label>
                <input
                  className="form-input"
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  placeholder="e.g. Business Current Account"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input
                  className="form-input"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  placeholder="e.g. Barclays"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  className="form-input"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  placeholder="12345678"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Code</label>
                <input
                  className="form-input"
                  name="sortCode"
                  value={form.sortCode}
                  onChange={handleChange}
                  placeholder="12-34-56"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">IBAN</label>
                <input
                  className="form-input"
                  name="iban"
                  value={form.iban}
                  onChange={handleChange}
                  placeholder="GB00 XXXX 0000 0000 0000 00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">SWIFT/BIC</label>
                <input
                  className="form-input"
                  name="swiftBic"
                  value={form.swiftBic}
                  onChange={handleChange}
                  placeholder="BARCGB22"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" name="currency" value={form.currency} onChange={handleChange}>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Opening Balance</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  name="openingBalance"
                  value={form.openingBalance}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-check">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault}
                  onChange={handleChange}
                />
                <span>Set as default account</span>
              </label>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Bank Accounts page ──────────────────────────────────────────── */
export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Modal state */
  const [formOpen, setFormOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  /* Delete state */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch accounts ────────────────────────────────────────────── */
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/bank-accounts');
      setAccounts(res.bankAccounts || []);
    } catch (err) {
      setError(err.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  /* ── Toggle active/inactive ────────────────────────────────────── */
  async function handleToggleActive(acct) {
    try {
      await api.put(`/bank-accounts/${acct.id}`, {
        accountName: acct.account_name,
        bankName: acct.bank_name,
        accountNumber: acct.account_number,
        sortCode: acct.sort_code,
        iban: acct.iban,
        swiftBic: acct.swift_bic,
        currency: acct.currency,
        openingBalance: acct.opening_balance,
        isDefault: acct.is_default,
        isActive: !acct.is_active,
      });
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to update account');
    }
  }

  /* ── Delete handler ────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/bank-accounts/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Open edit ─────────────────────────────────────────────────── */
  function openEdit(acct) {
    setEditAccount(acct);
    setFormOpen(true);
  }

  function openAdd() {
    setEditAccount(null);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditAccount(null);
    fetchAccounts();
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Bank Accounts</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert--danger">
          <span>{error}</span>
          <button className="btn btn-primary btn-sm" onClick={fetchAccounts} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="loading-spinner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <div className="page-loader__spinner" />
            <p className="text-muted" style={{ marginTop: 16 }}>Loading bank accounts...</p>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────────── */
        <div className="card empty-state">
          <div className="empty-state__icon">&#x1F3E6;</div>
          <h3 className="empty-state__title">No bank accounts</h3>
          <p className="empty-state__text">Add your first bank account to start tracking your finances.</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>
      ) : (
        /* ── Card grid ────────────────────────────────────────────── */
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {accounts.map((acct) => (
            <div
              className="card"
              key={acct.id}
              style={{
                position: 'relative',
                opacity: acct.is_active === false ? 0.6 : 1,
              }}
            >
              {/* Top row: account name + badges */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    {acct.account_name}
                  </h3>
                  {acct.bank_name && (
                    <p className="text-muted text-sm" style={{ marginTop: 2 }}>{acct.bank_name}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {acct.is_default ? (
                    <span className="badge badge--info">Default</span>
                  ) : null}
                  <span className={`badge ${acct.is_active !== false ? 'badge--success' : 'badge--neutral'}`}>
                    {acct.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Balance */}
              <div style={{ margin: '16px 0' }}>
                <p className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>
                  Current Balance
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)' }}>
                  {formatGBP(acct.current_balance)}
                </p>
              </div>

              {/* Account details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.85rem', marginBottom: 16 }}>
                {acct.account_number && (
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account No.</span>
                    <p style={{ fontWeight: 500, marginTop: 2 }}>{acct.account_number}</p>
                  </div>
                )}
                {acct.sort_code && (
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort Code</span>
                    <p style={{ fontWeight: 500, marginTop: 2 }}>{acct.sort_code}</p>
                  </div>
                )}
                {acct.iban && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IBAN</span>
                    <p style={{ fontWeight: 500, marginTop: 2, wordBreak: 'break-all' }}>{acct.iban}</p>
                  </div>
                )}
                {acct.currency && (
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Currency</span>
                    <p style={{ fontWeight: 500, marginTop: 2 }}>{acct.currency}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(acct)}>Edit</button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleToggleActive(acct)}
                >
                  {acct.is_active !== false ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="btn btn-sm btn-danger-outline"
                  onClick={() => setDeleteTarget(acct)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Form modal ──────────────────────────────────────────────── */}
      <AccountFormModal
        open={formOpen}
        account={editAccount}
        onClose={() => { setFormOpen(false); setEditAccount(null); }}
        onSaved={handleSaved}
      />

      {/* ── Delete confirmation ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Bank Account"
        message={`Are you sure you want to delete "${deleteTarget?.account_name || ''}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        busy={deleting}
      />
    </div>
  );
}
