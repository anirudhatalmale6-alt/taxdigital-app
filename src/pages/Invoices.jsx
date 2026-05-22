import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

/* ── Status badge ─────────────────────────────────────────────────── */
const STATUS_COLORS = {
  Draft: 'badge-gray',
  Sent: 'badge-blue',
  Paid: 'badge-green',
  Overdue: 'badge-red',
  Partial: 'badge-orange',
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

/* ── Confirm dialog ───────────────────────────────────────────────── */
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Invoices list page ───────────────────────────────────────────── */
export default function Invoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch invoices ─────────────────────────────────────────────── */
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (customerFilter) params.append('customerId', customerFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('limit', '100');
      params.append('offset', '0');

      const qs = params.toString();
      const res = await api.get(`/invoices${qs ? `?${qs}` : ''}`);
      setInvoices(res.invoices || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, customerFilter, dateFrom, dateTo]);

  /* ── Fetch customers for filter dropdown ────────────────────────── */
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.get('/customers');
        setCustomers(res.customers || []);
      } catch {
        // Non-critical — filter just won't have customer options
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /* ── Delete handler ─────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/invoices/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      alert(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="card filter-bar">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Customer</label>
          <select
            className="input"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.company || `Customer #${c.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">From</label>
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">To</label>
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="card error-card">
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchInvoices}>Retry</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading invoices...</p>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No invoices found</h3>
          <p className="text-muted">
            {statusFilter || customerFilter || dateFrom || dateTo
              ? 'Try adjusting your filters.'
              : 'Create your first invoice to get started.'}
          </p>
          {!statusFilter && !customerFilter && !dateFrom && !dateTo && (
            <Link to="/invoices/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + New Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} className="link">
                        {inv.invoiceNumber || inv.invoice_number}
                      </Link>
                    </td>
                    <td>{inv.customerName || inv.customer_name || '—'}</td>
                    <td>{formatDate(inv.invoiceDate || inv.invoice_date)}</td>
                    <td>{formatDate(inv.dueDate || inv.due_date)}</td>
                    <td className="text-right">{formatGBP(inv.total)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => setDeleteTarget(inv)}
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

      {/* ── Delete confirmation ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteTarget?.invoiceNumber || deleteTarget?.invoice_number || ''}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
