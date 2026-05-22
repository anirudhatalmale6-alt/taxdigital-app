import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

/* ── Skeleton placeholders ────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-text skeleton-short" />
      <div className="skeleton skeleton-text skeleton-wide" />
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}>
              <div className="skeleton skeleton-text skeleton-short" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div className="skeleton skeleton-text" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: color || '#e8f0fe' }}>
        <span>{icon}</span>
      </div>
      <div className="stat-card-body">
        <p className="stat-card-label">{label}</p>
        <h3 className="stat-card-value">{formatGBP(value)}</h3>
      </div>
    </div>
  );
}

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

/* ── Dashboard page ───────────────────────────────────────────────── */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>

        <div className="stats-grid stats-grid-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="stats-grid stats-grid-2" style={{ marginTop: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title">Invoices</h3>
            <SkeletonTable rows={1} cols={3} />
          </div>
          <div className="card">
            <h3 className="card-title">Bills</h3>
            <SkeletonTable rows={1} cols={3} />
          </div>
        </div>

        <div className="stats-grid stats-grid-2" style={{ marginTop: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title">Recent Invoices</h3>
            <SkeletonTable rows={5} cols={5} />
          </div>
          <div className="card">
            <h3 className="card-title">Recent Bills</h3>
            <SkeletonTable rows={5} cols={5} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="page-container">
        <h1 className="page-title">Dashboard</h1>
        <div className="card error-card">
          <p>Failed to load dashboard data.</p>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    bankBalance = 0,
    profitThisMonth = 0,
    accountsReceivable = 0,
    accountsPayable = 0,
    invoices = {},
    bills = {},
    recentInvoices = [],
    recentBills = [],
  } = data || {};

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      {/* ── Top stat cards ──────────────────────────────────────────── */}
      <div className="stats-grid stats-grid-4">
        <StatCard icon="🏦" label="Bank Balance" value={bankBalance} color="#e8f0fe" />
        <StatCard icon="📈" label="Profit This Month" value={profitThisMonth} color="#e6f9e8" />
        <StatCard icon="📥" label="Accounts Receivable" value={accountsReceivable} color="#fff7e6" />
        <StatCard icon="📤" label="Accounts Payable" value={accountsPayable} color="#fce8e8" />
      </div>

      {/* ── Invoice & Bill summaries ────────────────────────────────── */}
      <div className="stats-grid stats-grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title">Invoices</h3>
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Total</span>
              <span className="summary-value">{invoices.total_invoices ?? 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Outstanding</span>
              <span className="summary-value">{formatGBP(invoices.total_outstanding)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Paid</span>
              <span className="summary-value">{formatGBP(invoices.total_paid)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Bills</h3>
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Total</span>
              <span className="summary-value">{bills.total_bills ?? bills.total_invoices ?? 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Outstanding</span>
              <span className="summary-value">{formatGBP(bills.total_outstanding)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Paid</span>
              <span className="summary-value">{formatGBP(bills.total_paid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent invoices & bills tables ──────────────────────────── */}
      <div className="stats-grid stats-grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title">Recent Invoices</h3>
            <Link to="/invoices" className="btn btn-sm btn-outline">View All</Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-muted text-center">No recent invoices</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}`} className="link">
                          {inv.invoiceNumber || inv.invoice_number}
                        </Link>
                      </td>
                      <td>{inv.customerName || inv.customer_name || '—'}</td>
                      <td>{formatDate(inv.invoiceDate || inv.invoice_date)}</td>
                      <td>{formatGBP(inv.total)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title">Recent Bills</h3>
            <Link to="/bills" className="btn btn-sm btn-outline">View All</Link>
          </div>

          {recentBills.length === 0 ? (
            <p className="text-muted text-center">No recent bills</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.slice(0, 5).map((bill) => (
                    <tr key={bill.id}>
                      <td>
                        <Link to={`/bills/${bill.id}`} className="link">
                          {bill.billNumber || bill.bill_number}
                        </Link>
                      </td>
                      <td>{bill.supplierName || bill.supplier_name || '—'}</td>
                      <td>{formatDate(bill.billDate || bill.bill_date)}</td>
                      <td>{formatGBP(bill.total)}</td>
                      <td><StatusBadge status={bill.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
