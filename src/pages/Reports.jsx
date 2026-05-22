import React, { useState } from 'react';
import api from '../api';

/* ── Helpers ─────────────────────────────────────────────────────── */
const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const today = () => new Date().toISOString().slice(0, 10);
const yearStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
};

/* ── Tab constants ───────────────────────────────────────────────── */
const TABS = [
  { key: 'pl', label: 'Profit & Loss' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'tb', label: 'Trial Balance' },
];

/* ══════════════════════════════════════════════════════════════════
   Reports Page
   ══════════════════════════════════════════════════════════════════ */
export default function Reports() {
  const [activeTab, setActiveTab] = useState('pl');

  /* ── Date controls ─────────────────────────────────────────────── */
  const [dateFrom, setDateFrom] = useState(yearStart);
  const [dateTo, setDateTo] = useState(today);
  const [asAt, setAsAt] = useState(today);

  /* ── Report data ───────────────────────────────────────────────── */
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ── Generate report ───────────────────────────────────────────── */
  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      setReport(null);

      let res;
      switch (activeTab) {
        case 'pl':
          res = await api.get(`/reports/pl?dateFrom=${dateFrom}&dateTo=${dateTo}`);
          break;
        case 'bs':
          res = await api.get(`/reports/bs?asAt=${asAt}`);
          break;
        case 'tb':
          res = await api.get(`/reports/tb?asAt=${asAt}`);
          break;
        default:
          return;
      }
      setReport({ tab: activeTab, data: res });
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  /* ── Print ─────────────────────────────────────────────────────── */
  function handlePrint() {
    window.print();
  }

  /* ── Clear report when switching tabs ──────────────────────────── */
  function switchTab(tab) {
    setActiveTab(tab);
    setReport(null);
    setError(null);
  }

  const needsDateRange = activeTab === 'pl';
  const needsAsAt = activeTab === 'bs' || activeTab === 'tb';

  return (
    <div className="page-container reports-page">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        {report && (
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            Print Report
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'tab-active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Date controls ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          {needsDateRange && (
            <>
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
            </>
          )}
          {needsAsAt && (
            <div className="filter-group">
              <label className="filter-label">As at date</label>
              <input
                type="date"
                className="input"
                value={asAt}
                onChange={(e) => setAsAt(e.target.value)}
              />
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="card error-card" style={{ marginBottom: '1.5rem' }}>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Generating report...</p>
          </div>
        </div>
      )}

      {/* ── Report output ────────────────────────────────────────────── */}
      {report && report.tab === 'pl' && <ProfitAndLoss data={report.data} />}
      {report && report.tab === 'bs' && <BalanceSheet data={report.data} />}
      {report && report.tab === 'tb' && <TrialBalance data={report.data} />}

      {/* ── Print styles ─────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .sidebar, .topbar, .page-header, .tabs, .filter-group,
          .btn, .filter-bar, .card:has(.filter-group) { display: none !important; }
          .main { margin-left: 0 !important; }
          .content { padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
          .reports-page .report-print-header { display: block !important; }
        }
        .report-print-header { display: none; }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Profit & Loss
   ══════════════════════════════════════════════════════════════════ */
function ProfitAndLoss({ data }) {
  const {
    period,
    income = 0,
    expense = 0,
    netProfit = 0,
    incomeBreakdown = [],
    expenseBreakdown = [],
  } = data;

  const isLoss = netProfit < 0;

  return (
    <div className="card report-section">
      <div className="report-print-header">
        <h2>Profit & Loss Statement</h2>
        {period && <p className="text-muted">Period: {period}</p>}
      </div>

      <h3 className="card-title" style={{ marginBottom: '4px' }}>Profit & Loss</h3>
      {period && <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>Period: {period}</p>}

      {/* Income section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '12px', borderBottom: '2px solid var(--color-success)', paddingBottom: '6px' }}>
          Income
        </h4>
        {incomeBreakdown.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-right">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {incomeBreakdown.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || item.account || item.category}</td>
                    <td className="text-right">{formatGBP(item.amount || item.total)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'var(--color-success-light)', fontWeight: 700 }}>
                  <td>Total Income</td>
                  <td className="text-right">{formatGBP(income)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No income items for this period.</p>
        )}
      </div>

      {/* Expense section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '12px', borderBottom: '2px solid var(--color-danger)', paddingBottom: '6px' }}>
          Expenses
        </h4>
        {expenseBreakdown.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-right">Amount (£)</th>
                </tr>
              </thead>
              <tbody>
                {expenseBreakdown.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || item.account || item.category}</td>
                    <td className="text-right">{formatGBP(item.amount || item.total)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'var(--color-danger-light)', fontWeight: 700 }}>
                  <td>Total Expenses</td>
                  <td className="text-right">{formatGBP(expense)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No expense items for this period.</p>
        )}
      </div>

      {/* Net Profit / Loss */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius)',
          backgroundColor: isLoss ? 'var(--color-danger-light)' : 'var(--color-success-light)',
          border: `2px solid ${isLoss ? 'var(--color-danger)' : 'var(--color-success)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1rem', color: isLoss ? 'var(--color-danger)' : 'var(--color-success)' }}>
          Net {isLoss ? 'Loss' : 'Profit'}
        </span>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: isLoss ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {formatGBP(Math.abs(netProfit))}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Balance Sheet
   ══════════════════════════════════════════════════════════════════ */
function BalanceSheet({ data }) {
  const { asAt, assets, liabilities, equity, balanceCheck } = data;

  function renderSection(title, section, colorKey) {
    if (!section) return null;
    const colors = {
      assets:      { header: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
      liabilities: { header: 'var(--color-danger)',  bg: 'var(--color-danger-light)'  },
      equity:      { header: 'var(--color-success)', bg: 'var(--color-success-light)' },
    };
    const c = colors[colorKey] || colors.assets;

    // Handle section that has sub-sections (current/fixed or current/longTerm)
    const hasSubs = section.current || section.fixed || section.longTerm;

    if (hasSubs) {
      return (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: c.header, marginBottom: '12px', borderBottom: `2px solid ${c.header}`, paddingBottom: '6px' }}>
            {title}
          </h4>

          {section.current && (
            <div style={{ marginBottom: '12px' }}>
              <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', paddingLeft: '8px' }}>
                Current
              </h5>
              <div className="table-responsive">
                <table className="table">
                  <tbody>
                    {(section.current.items || []).map((item, i) => (
                      <tr key={i}>
                        <td style={{ paddingLeft: '24px' }}>{item.name || item.account}</td>
                        <td className="text-right">{formatGBP(item.amount || item.balance || item.total)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: c.bg, fontWeight: 600 }}>
                      <td style={{ paddingLeft: '24px' }}>Total Current</td>
                      <td className="text-right">{formatGBP(section.current.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(section.fixed || section.longTerm) && (
            <div style={{ marginBottom: '12px' }}>
              <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', paddingLeft: '8px' }}>
                {section.fixed ? 'Fixed' : 'Long-Term'}
              </h5>
              <div className="table-responsive">
                <table className="table">
                  <tbody>
                    {((section.fixed || section.longTerm).items || []).map((item, i) => (
                      <tr key={i}>
                        <td style={{ paddingLeft: '24px' }}>{item.name || item.account}</td>
                        <td className="text-right">{formatGBP(item.amount || item.balance || item.total)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: c.bg, fontWeight: 600 }}>
                      <td style={{ paddingLeft: '24px' }}>Total {section.fixed ? 'Fixed' : 'Long-Term'}</td>
                      <td className="text-right">{formatGBP((section.fixed || section.longTerm).total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section grand total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: c.bg, borderRadius: 'var(--radius-sm)', fontWeight: 700, borderLeft: `4px solid ${c.header}` }}>
            <span>Total {title}</span>
            <span>
              {formatGBP(
                (section.current?.total || 0) + ((section.fixed || section.longTerm)?.total || 0)
              )}
            </span>
          </div>
        </div>
      );
    }

    // Simple section (equity)
    return (
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: c.header, marginBottom: '12px', borderBottom: `2px solid ${c.header}`, paddingBottom: '6px' }}>
          {title}
        </h4>
        <div className="table-responsive">
          <table className="table">
            <tbody>
              {(section.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: '24px' }}>{item.name || item.account}</td>
                  <td className="text-right">{formatGBP(item.amount || item.balance || item.total)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: c.bg, fontWeight: 700 }}>
                <td>Total {title}</td>
                <td className="text-right">{formatGBP(section.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card report-section">
      <div className="report-print-header">
        <h2>Balance Sheet</h2>
        {asAt && <p className="text-muted">As at: {asAt}</p>}
      </div>

      <h3 className="card-title" style={{ marginBottom: '4px' }}>Balance Sheet</h3>
      {asAt && <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>As at: {asAt}</p>}

      {renderSection('Assets', assets, 'assets')}
      {renderSection('Liabilities', liabilities, 'liabilities')}
      {renderSection('Equity', equity, 'equity')}

      {/* Balance check */}
      {balanceCheck !== undefined && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: 'var(--radius)',
            backgroundColor: balanceCheck === true || balanceCheck === 0
              ? 'var(--color-success-light)'
              : 'var(--color-warning-light)',
            border: `2px solid ${
              balanceCheck === true || balanceCheck === 0
                ? 'var(--color-success)'
                : 'var(--color-warning)'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700 }}>Balance Check</span>
          <span
            className={`badge ${
              balanceCheck === true || balanceCheck === 0 ? 'badge-green' : 'badge-orange'
            }`}
          >
            {balanceCheck === true || balanceCheck === 0 ? 'Balanced' : `Difference: ${formatGBP(balanceCheck)}`}
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Trial Balance
   ══════════════════════════════════════════════════════════════════ */
function TrialBalance({ data }) {
  const { asAt, lines = [], totals } = data;

  /* ── Type badge colors ─────────────────────────────────────────── */
  const typeBadge = (type) => {
    const map = {
      ASSET:     'badge-blue',
      LIABILITY: 'badge-red',
      EQUITY:    'badge-green',
      INCOME:    'badge-orange',
      EXPENSE:   'badge-purple',
    };
    return map[(type || '').toUpperCase()] || 'badge-gray';
  };

  const isBalanced =
    totals &&
    Math.abs((totals.debit || totals.total_debit || 0) - (totals.credit || totals.total_credit || 0)) < 0.01;

  return (
    <div className="card report-section">
      <div className="report-print-header">
        <h2>Trial Balance</h2>
        {asAt && <p className="text-muted">As at: {asAt}</p>}
      </div>

      <h3 className="card-title" style={{ marginBottom: '4px' }}>Trial Balance</h3>
      {asAt && <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>As at: {asAt}</p>}

      {lines.length === 0 ? (
        <div className="empty-state">
          <p className="text-muted">No trial balance data for this date.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Code</th>
                <th>Account Name</th>
                <th style={{ width: '120px' }}>Type</th>
                <th className="text-right" style={{ width: '140px' }}>Debit (£)</th>
                <th className="text-right" style={{ width: '140px' }}>Credit (£)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{line.code}</td>
                  <td>{line.name}</td>
                  <td>
                    <span className={`badge ${typeBadge(line.type)}`}>
                      {line.type}
                    </span>
                  </td>
                  <td className="text-right">{formatGBP(line.total_debit)}</td>
                  <td className="text-right">{formatGBP(line.total_credit)}</td>
                </tr>
              ))}

              {/* Totals row */}
              {totals && (
                <tr
                  style={{
                    backgroundColor: isBalanced ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                    fontWeight: 700,
                  }}
                >
                  <td colSpan={3} style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Total
                    {isBalanced && (
                      <span className="badge badge-green" style={{ marginLeft: '8px' }}>Balanced</span>
                    )}
                    {!isBalanced && (
                      <span className="badge badge-orange" style={{ marginLeft: '8px' }}>Unbalanced</span>
                    )}
                  </td>
                  <td className="text-right" style={{ fontWeight: 700 }}>
                    {formatGBP(totals.debit || totals.total_debit)}
                  </td>
                  <td className="text-right" style={{ fontWeight: 700 }}>
                    {formatGBP(totals.credit || totals.total_credit)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
