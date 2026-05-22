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
  Unpaid: 'badge-orange',
  Paid: 'badge-green',
  Overdue: 'badge-red',
  Partial: 'badge-blue',
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

/* ── Bills list page ─────────────────────────────────────────────── */
export default function Bills() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch suppliers for filter ────────────────────────────────── */
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await api.get('/suppliers');
        setSuppliers(res.suppliers || []);
      } catch {
        // Non-critical — filter just won't have supplier options
      }
    }
    loadSuppliers();
  }, []);

  /* ── Fetch bills ───────────────────────────────────────────────── */
  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (supplierFilter) params.append('supplierId', supplierFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('limit', '100');
      params.append('offset', '0');

      const qs = params.toString();
      const res = await api.get(`/bills${qs ? `?${qs}` : ''}`);
      setBills(res.bills || []);
    } catch (err) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, supplierFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  /* ── Delete handler ────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/bills/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchBills();
    } catch (err) {
      alert(err.message || 'Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Bills</h1>
        <Link to="/bills/new" className="btn btn-primary">+ New Bill</Link>
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
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Supplier</label>
          <select
            className="input"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.company || `Supplier #${s.id}`}
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
          <button className="btn btn-primary btn-sm" onClick={fetchBills}>Retry</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading bills...</p>
          </div>
        </div>
      ) : bills.length === 0 ? (
        <div className="card empty-state">
          <h3>No bills found</h3>
          <p className="text-muted">
            {statusFilter || supplierFilter || dateFrom || dateTo
              ? 'Try adjusting your filters.'
              : 'Create your first bill to get started.'}
          </p>
          {!statusFilter && !supplierFilter && !dateFrom && !dateTo && (
            <Link to="/bills/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + New Bill
            </Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      <Link to={`/bills/${bill.id}`} className="link">
                        {bill.bill_number || bill.billNumber}
                      </Link>
                    </td>
                    <td>{bill.supplier_name || bill.supplierName || '—'}</td>
                    <td>{formatDate(bill.bill_date || bill.billDate)}</td>
                    <td>{formatDate(bill.due_date || bill.dueDate)}</td>
                    <td className="text-right">{formatGBP(bill.total)}</td>
                    <td><StatusBadge status={bill.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/bills/${bill.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => setDeleteTarget(bill)}
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
        title="Delete Bill"
        message={`Are you sure you want to delete bill ${deleteTarget?.bill_number || deleteTarget?.billNumber || ''}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
