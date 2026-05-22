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
  Accepted: 'badge-green',
  Declined: 'badge-red',
  Expired: 'badge-orange',
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

/* ── Confirm dialog ───────────────────────────────────────────────── */
function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, loading: busy }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Processing...' : confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Estimates list page ─────────────────────────────────────────── */
export default function Estimates() {
  const navigate = useNavigate();

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* Convert confirm */
  const [convertTarget, setConvertTarget] = useState(null);
  const [converting, setConverting] = useState(false);

  /* ── Fetch estimates ───────────────────────────────────────────── */
  const fetchEstimates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');
      params.append('offset', '0');

      const qs = params.toString();
      const res = await api.get(`/estimates${qs ? `?${qs}` : ''}`);
      setEstimates(res.estimates || []);
    } catch (err) {
      setError(err.message || 'Failed to load estimates');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  /* ── Delete handler ────────────────────────────────────────────── */
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/estimates/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchEstimates();
    } catch (err) {
      alert(err.message || 'Failed to delete estimate');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Convert to invoice handler ────────────────────────────────── */
  async function handleConvert() {
    if (!convertTarget) return;
    try {
      setConverting(true);
      await api.post(`/estimates/${convertTarget.id}/convert-to-invoice`);
      setConvertTarget(null);
      fetchEstimates();
    } catch (err) {
      alert(err.message || 'Failed to convert estimate to invoice');
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Estimates</h1>
        <Link to="/estimates/new" className="btn btn-primary">+ New Estimate</Link>
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
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="card error-card">
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchEstimates}>Retry</button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading estimates...</p>
          </div>
        </div>
      ) : estimates.length === 0 ? (
        <div className="card empty-state">
          <h3>No estimates found</h3>
          <p className="text-muted">
            {statusFilter
              ? 'Try adjusting your filters.'
              : 'Create your first estimate to get started.'}
          </p>
          {!statusFilter && (
            <Link to="/estimates/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + New Estimate
            </Link>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Estimate #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Expiry</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est) => (
                  <tr key={est.id}>
                    <td>
                      <Link to={`/estimates/${est.id}`} className="link">
                        {est.estimate_number}
                      </Link>
                    </td>
                    <td>{est.customer_name || '—'}</td>
                    <td>{formatDate(est.estimate_date)}</td>
                    <td>{formatDate(est.expiry_date)}</td>
                    <td className="text-right">{formatGBP(est.total)}</td>
                    <td><StatusBadge status={est.status} /></td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => navigate(`/estimates/${est.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setConvertTarget(est)}
                        >
                          Convert to Invoice
                        </button>
                        <button
                          className="btn btn-sm btn-danger-outline"
                          onClick={() => setDeleteTarget(est)}
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
        title="Delete Estimate"
        message={`Are you sure you want to delete estimate ${deleteTarget?.estimate_number || ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
      />

      {/* ── Convert confirmation ────────────────────────────────────── */}
      <ConfirmDialog
        open={!!convertTarget}
        title="Convert to Invoice"
        message={`Are you sure you want to convert estimate ${convertTarget?.estimate_number || ''} to an invoice? This action cannot be undone.`}
        confirmLabel="Yes, Convert"
        onConfirm={handleConvert}
        onCancel={() => !converting && setConvertTarget(null)}
        loading={converting}
      />
    </div>
  );
}
