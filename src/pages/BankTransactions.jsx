import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'REFUND', 'FEE', 'INTEREST'];

const DEPOSIT_TYPES = ['DEPOSIT', 'REFUND', 'INTEREST'];

function isCredit(type) {
  return DEPOSIT_TYPES.includes(type);
}

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

/* ── Transaction form modal ──────────────────────────────────────── */
const EMPTY_FORM = {
  bankAccountId: '',
  transactionDate: new Date().toISOString().split('T')[0],
  type: 'DEPOSIT',
  amount: '',
  description: '',
  reference: '',
  category: '',
};

function TransactionFormModal({ open, bankAccounts, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        bankAccountId: bankAccounts.length > 0 ? String(bankAccounts[0].id) : '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
      setError(null);
    }
  }, [open, bankAccounts]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.bankAccountId) {
      setError('Please select a bank account');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await api.post('/bank-transactions', {
        bankAccountId: Number(form.bankAccountId),
        transactionDate: form.transactionDate,
        type: form.type,
        amount: Number(form.amount),
        description: form.description.trim(),
        reference: form.reference.trim(),
        category: form.category.trim(),
      });
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Add Transaction</h3>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {error && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label className="form-label form-label--required">Bank Account</label>
              <select className="form-select" name="bankAccountId" value={form.bankAccountId} onChange={handleChange}>
                <option value="">-- Select Account --</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name}{a.bank_name ? ` (${a.bank_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label--required">Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label form-label--required">Type</label>
                <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label--required">Amount</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Payment description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reference</label>
                <input
                  className="form-input"
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="REF-001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Office Supplies"
                />
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Bank Transactions page ──────────────────────────────────────── */
export default function BankTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Filters */
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Modal */
  const [formOpen, setFormOpen] = useState(false);

  /* Bulk reconcile */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reconciling, setReconciling] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch bank accounts for filter/form ───────────────────────── */
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await api.get('/bank-accounts');
        setBankAccounts(res.bankAccounts || []);
      } catch {
        // Non-critical
      }
    }
    loadAccounts();
  }, []);

  /* ── Fetch transactions ────────────────────────────────────────── */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (accountFilter) params.append('bankAccountId', accountFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('limit', '100');
      params.append('offset', '0');

      const qs = params.toString();
      const res = await api.get(`/bank-transactions${qs ? `?${qs}` : ''}`);
      setTransactions(res.transactions || []);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [accountFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /* ── Checkbox handlers ─────────────────────────────────────────── */
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    const unreconciledIds = transactions.filter((t) => !t.is_reconciled).map((t) => t.id);
    if (unreconciledIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unreconciledIds));
    }
  }

  /* ── Bulk reconcile ────────────────────────────────────────────── */
  async function handleReconcile() {
    if (selectedIds.size === 0) return;
    try {
      setReconciling(true);
      await api.post('/bank-transactions/reconcile', {
        transactionIds: Array.from(selectedIds),
      });
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to reconcile transactions');
    } finally {
      setReconciling(false);
    }
  }

  /* ── Delete handler ────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/bank-transactions/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved() {
    setFormOpen(false);
    fetchTransactions();
  }

  const unreconciledCount = transactions.filter((t) => !t.is_reconciled).length;

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Bank Transactions</h1>
        <div className="page-header__actions">
          {selectedIds.size > 0 && (
            <button
              className="btn btn-outline"
              onClick={handleReconcile}
              disabled={reconciling}
            >
              {reconciling ? 'Reconciling...' : `Reconcile Selected (${selectedIds.size})`}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Add Transaction</button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="card filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="filter-group" style={{ minWidth: 160 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>Bank Account</label>
          <select className="form-select" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="">All Accounts</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ minWidth: 140 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>Type</label>
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ minWidth: 140 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>From</label>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group" style={{ minWidth: 140 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>To</label>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert--danger">
          <span>{error}</span>
          <button className="btn btn-primary btn-sm" onClick={fetchTransactions} style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <div className="page-loader__spinner" />
            <p className="text-muted" style={{ marginTop: 16 }}>Loading transactions...</p>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state__icon">&#x1F4B3;</div>
          <h3 className="empty-state__title">No transactions found</h3>
          <p className="empty-state__text">
            {accountFilter || typeFilter || dateFrom || dateTo
              ? 'Try adjusting your filters.'
              : 'Add your first bank transaction to get started.'}
          </p>
          {!accountFilter && !typeFilter && !dateFrom && !dateTo && (
            <button className="btn btn-primary" onClick={() => setFormOpen(true)} style={{ marginTop: 8 }}>
              + Add Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    {unreconciledCount > 0 && (
                      <input
                        type="checkbox"
                        checked={
                          unreconciledCount > 0 &&
                          transactions.filter((t) => !t.is_reconciled).every((t) => selectedIds.has(t.id))
                        }
                        onChange={toggleSelectAll}
                        title="Select all unreconciled"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                    )}
                  </th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th style={{ textAlign: 'center' }}>Reconciled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const credit = isCredit(txn.type);
                  return (
                    <tr key={txn.id}>
                      <td style={{ textAlign: 'center' }}>
                        {!txn.is_reconciled ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(txn.id)}
                            onChange={() => toggleSelect(txn.id)}
                            style={{ accentColor: 'var(--color-primary)' }}
                          />
                        ) : null}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(txn.transaction_date)}</td>
                      <td>
                        <span className={`badge ${credit ? 'badge--success' : 'badge--danger'}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td>{txn.description || '—'}</td>
                      <td>{txn.reference || '—'}</td>
                      <td>{txn.category || '—'}</td>
                      <td
                        className="text-right font-semibold"
                        style={{ color: credit ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}
                      >
                        {credit ? '+' : '-'}{formatGBP(txn.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {txn.is_reconciled ? (
                          <span style={{ color: 'var(--color-success)', fontSize: '1.1rem' }}>&#10003;</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => setDeleteTarget(txn)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add transaction modal ───────────────────────────────────── */}
      <TransactionFormModal
        open={formOpen}
        bankAccounts={bankAccounts.filter((a) => a.is_active !== false)}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* ── Delete confirmation ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTarget?.type?.toLowerCase() || ''} transaction of ${formatGBP(deleteTarget?.amount)}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        busy={deleting}
      />
    </div>
  );
}
