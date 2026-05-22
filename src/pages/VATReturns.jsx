import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

/* ── Helpers ─────────────────────────────────────────────────────── */
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

const today = () => new Date().toISOString().slice(0, 10);
const threeMonthsAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
};

/* ── Box descriptions ────────────────────────────────────────────── */
const BOX_DESCRIPTIONS = {
  box1: 'VAT due on sales and other outputs',
  box2: 'VAT due on acquisitions from other EC Member States',
  box3: 'Total VAT due (Box 1 + Box 2)',
  box4: 'VAT reclaimed on purchases and other inputs',
  box5: 'Net VAT to pay or reclaim (Box 3 - Box 4)',
  box6: 'Total value of sales and other outputs ex. VAT',
  box7: 'Total value of purchases and other inputs ex. VAT',
  box8: 'Total value of supplies of goods to other EC Member States',
  box9: 'Total value of acquisitions of goods from other EC Member States',
};

/* ══════════════════════════════════════════════════════════════════
   VAT Returns Page
   ══════════════════════════════════════════════════════════════════ */
export default function VATReturns() {
  /* ── HMRC connection ───────────────────────────────────────────── */
  const [hmrcStatus, setHmrcStatus] = useState(null);
  const [hmrcLoading, setHmrcLoading] = useState(true);

  /* ── Date range ────────────────────────────────────────────────── */
  const [dateFrom, setDateFrom] = useState(threeMonthsAgo);
  const [dateTo, setDateTo] = useState(today);

  /* ── VAT return data ───────────────────────────────────────────── */
  const [vatReturn, setVatReturn] = useState(null);
  const [vatSummary, setVatSummary] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  /* ── Submit state ──────────────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [vrn, setVrn] = useState('');

  /* ── Submission history ────────────────────────────────────────── */
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  /* ── Fetch HMRC status ─────────────────────────────────────────── */
  const fetchHmrcStatus = useCallback(async () => {
    try {
      setHmrcLoading(true);
      const res = await api.get('/hmrc/status');
      setHmrcStatus(res);
    } catch {
      setHmrcStatus({ connected: false });
    } finally {
      setHmrcLoading(false);
    }
  }, []);

  /* ── Fetch submission history ──────────────────────────────────── */
  const fetchSubmissions = useCallback(async () => {
    try {
      setSubsLoading(true);
      const res = await api.get('/hmrc/vat-submissions');
      setSubmissions(res.items || []);
    } catch {
      setSubmissions([]);
    } finally {
      setSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHmrcStatus();
    fetchSubmissions();
  }, [fetchHmrcStatus, fetchSubmissions]);

  /* ── Calculate VAT Return ──────────────────────────────────────── */
  async function handleCalculate() {
    if (!dateFrom || !dateTo) return;
    try {
      setCalcLoading(true);
      setCalcError(null);
      setVatReturn(null);
      setVatSummary(null);
      setSubmitResult(null);
      setSubmitError(null);

      const [retRes, sumRes] = await Promise.all([
        api.get(`/vat/return?dateFrom=${dateFrom}&dateTo=${dateTo}`),
        api.get(`/vat/summary?dateFrom=${dateFrom}&dateTo=${dateTo}`),
      ]);

      setVatReturn(retRes);
      setVatSummary(sumRes);
    } catch (err) {
      setCalcError(err.message || 'Failed to calculate VAT return');
    } finally {
      setCalcLoading(false);
    }
  }

  /* ── Connect to HMRC ───────────────────────────────────────────── */
  async function handleConnect() {
    try {
      const res = await api.get('/hmrc/auth-url');
      if (res.url) {
        window.open(res.url, '_blank', 'noopener');
      }
    } catch (err) {
      alert(err.message || 'Failed to get HMRC auth URL');
    }
  }

  /* ── Submit to HMRC ────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!vatReturn?.boxes || !vrn.trim()) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitResult(null);
      const res = await api.post('/hmrc/vat-submit', {
        vrn: vrn.trim(),
        vatData: vatReturn.boxes,
      });
      setSubmitResult(res);
      setShowSubmitConfirm(false);
      fetchSubmissions();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit to HMRC');
      setShowSubmitConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  const isConnected = hmrcStatus?.connected === true;

  return (
    <div className="page-container">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">VAT Returns</h1>
      </div>

      {/* ── HMRC Connection Status ───────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>HMRC Connection</h3>
            {hmrcLoading ? (
              <span className="badge badge-gray">Checking...</span>
            ) : isConnected ? (
              <span className="badge badge-green">Connected</span>
            ) : (
              <span className="badge badge-red">Not Connected</span>
            )}
            {hmrcStatus?.tokenExpired && (
              <span className="badge badge-orange">Token Expired</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hmrcStatus?.lastUpdated && (
              <span className="text-muted text-sm">
                Last updated: {formatDate(hmrcStatus.lastUpdated)}
              </span>
            )}
            <button className="btn btn-primary btn-sm" onClick={handleConnect}>
              {isConnected ? 'Reconnect' : 'Connect to HMRC'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Date range picker + Calculate ────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>VAT Period</h3>
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
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
          <button
            className="btn btn-primary"
            onClick={handleCalculate}
            disabled={calcLoading || !dateFrom || !dateTo}
          >
            {calcLoading ? 'Calculating...' : 'Calculate VAT Return'}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {calcError && (
        <div className="card error-card" style={{ marginBottom: '1.5rem' }}>
          <p>{calcError}</p>
          <button className="btn btn-primary btn-sm" onClick={handleCalculate}>Retry</button>
        </div>
      )}

      {/* ── VAT Return boxes table ───────────────────────────────────── */}
      {vatReturn && vatReturn.boxes && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '4px' }}>
            VAT Return
          </h3>
          {vatReturn.period && (
            <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
              Period: {vatReturn.period}
            </p>
          )}

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Box</th>
                  <th>Description</th>
                  <th className="text-right" style={{ width: '160px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                  const key = `box${n}`;
                  const isBox5 = n === 5;
                  return (
                    <tr
                      key={key}
                      style={isBox5 ? {
                        backgroundColor: 'var(--color-primary-light)',
                        fontWeight: 700,
                      } : undefined}
                    >
                      <td>
                        <span
                          className={isBox5 ? 'badge badge-blue' : ''}
                          style={isBox5 ? {} : { fontWeight: 600 }}
                        >
                          Box {n}
                        </span>
                      </td>
                      <td style={isBox5 ? { fontWeight: 700 } : undefined}>
                        {BOX_DESCRIPTIONS[key]}
                      </td>
                      <td className="text-right" style={isBox5 ? { fontWeight: 700, fontSize: '1rem' } : undefined}>
                        {formatGBP(vatReturn.boxes[key])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VAT Summary ──────────────────────────────────────────────── */}
      {vatSummary && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>VAT Summary</h3>
          <div className="stats-grid stats-grid-3">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
              <p className="stat-card-label">VAT Collected</p>
              <h3 className="stat-card-value">{formatGBP(vatSummary.vatCollected)}</h3>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <p className="stat-card-label">VAT Paid</p>
              <h3 className="stat-card-value">{formatGBP(vatSummary.vatPaid)}</h3>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <p className="stat-card-label">VAT Owed</p>
              <h3 className="stat-card-value">{formatGBP(vatSummary.vatOwed)}</h3>
            </div>
          </div>
          <div className="stats-grid stats-grid-2" style={{ marginTop: '12px' }}>
            <div className="stat-card">
              <p className="stat-card-label">Total Sales</p>
              <h3 className="stat-card-value">{formatGBP(vatSummary.sales)}</h3>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">Total Purchases</p>
              <h3 className="stat-card-value">{formatGBP(vatSummary.purchases)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit to HMRC ───────────────────────────────────────────── */}
      {vatReturn && vatReturn.boxes && isConnected && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Submit to HMRC</h3>

          <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>!</span>
            <div>
              <strong>Warning:</strong> Submitting a VAT return to HMRC is final and cannot be undone.
              Please ensure all figures are correct before submitting.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
            <div className="filter-group">
              <label className="filter-label">VAT Registration Number (VRN)</label>
              <input
                type="text"
                className="input"
                value={vrn}
                onChange={(e) => setVrn(e.target.value)}
                placeholder="e.g. 123456789"
                style={{ minWidth: '220px' }}
              />
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting || !vrn.trim()}
            >
              Submit VAT Return to HMRC
            </button>
          </div>

          {submitResult && (
            <div className="alert alert-success" style={{ marginTop: '12px' }}>
              VAT return submitted successfully to HMRC.
            </div>
          )}

          {submitError && (
            <div className="alert alert-danger" style={{ marginTop: '12px' }}>
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* ── Submission history ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Submission History</h3>

        {subsLoading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">No VAT returns have been submitted yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>VRN</th>
                  <th>Submitted</th>
                  <th className="text-right">Net VAT (Box 5)</th>
                  <th>Status</th>
                  <th>HMRC Receipt</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, i) => (
                  <tr key={sub.id || i}>
                    <td>{sub.period || sub.periodKey || '—'}</td>
                    <td>{sub.vrn || '—'}</td>
                    <td>{formatDate(sub.submittedAt || sub.submitted_at || sub.createdAt)}</td>
                    <td className="text-right">{formatGBP(sub.netVat || sub.box5)}</td>
                    <td>
                      <span className={`badge ${sub.status === 'accepted' || sub.status === 'success' ? 'badge-green' : sub.status === 'rejected' ? 'badge-red' : 'badge-gray'}`}>
                        {sub.status || 'Submitted'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{sub.receiptId || sub.receipt_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Submit confirmation modal ────────────────────────────────── */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => !submitting && setShowSubmitConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Confirm HMRC Submission</h3>
            <div className="modal-body">
              <p style={{ marginBottom: '12px' }}>
                You are about to submit this VAT return to HMRC for VRN <strong>{vrn}</strong>.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Net VAT (Box 5):</strong> {formatGBP(vatReturn?.boxes?.box5)}
              </p>
              <p className="text-danger" style={{ fontWeight: 600 }}>
                This action is final and cannot be reversed.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
