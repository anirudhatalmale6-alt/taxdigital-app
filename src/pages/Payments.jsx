import React, { useState, useEffect } from 'react';
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

/* ── Receive Payment section ─────────────────────────────────────── */
function ReceivePayment({ invoices, onSuccess }) {
  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    memo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill amount when invoice changes
      if (name === 'invoiceId' && value) {
        const inv = invoices.find((i) => String(i.id) === value);
        if (inv) {
          const outstanding = Number(inv.total || 0) - Number(inv.amount_paid || 0);
          next.amount = outstanding > 0 ? outstanding.toFixed(2) : String(inv.total || 0);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.invoiceId) {
      setError('Please select an invoice');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post('/payments/customer-receipt', {
        invoiceId: Number(form.invoiceId),
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        memo: form.memo.trim(),
      });
      setSuccess('Payment received successfully');
      setForm({
        invoiceId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        memo: '',
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>&#8595;</span>
        Receive Payment
      </h3>

      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label form-label--required">Unpaid Invoice</label>
          <select className="form-select" name="invoiceId" value={form.invoiceId} onChange={handleChange}>
            <option value="">-- Select Invoice --</option>
            {invoices.map((inv) => {
              const invNum = inv.invoice_number || inv.invoiceNumber || `#${inv.id}`;
              const customer = inv.customer_name || inv.customerName || 'Unknown';
              const outstanding = Number(inv.total || 0) - Number(inv.amount_paid || 0);
              return (
                <option key={inv.id} value={inv.id}>
                  {invNum} — {customer} — {formatGBP(outstanding > 0 ? outstanding : inv.total)}
                </option>
              );
            })}
          </select>
          {invoices.length === 0 && (
            <p className="form-hint">No unpaid invoices found.</p>
          )}
        </div>

        <div className="form-row">
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
            <label className="form-label form-label--required">Payment Date</label>
            <input
              className="form-input"
              type="date"
              name="paymentDate"
              value={form.paymentDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Memo</label>
          <input
            className="form-input"
            name="memo"
            value={form.memo}
            onChange={handleChange}
            placeholder="Optional note about this payment"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
          {saving ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}

/* ── Make Payment section ────────────────────────────────────────── */
function MakePayment({ bills, onSuccess }) {
  const [form, setForm] = useState({
    billId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    memo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill amount when bill changes
      if (name === 'billId' && value) {
        const bill = bills.find((b) => String(b.id) === value);
        if (bill) {
          const outstanding = Number(bill.total || 0) - Number(bill.amount_paid || 0);
          next.amount = outstanding > 0 ? outstanding.toFixed(2) : String(bill.total || 0);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.billId) {
      setError('Please select a bill');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post('/payments/supplier-payment', {
        billId: Number(form.billId),
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        memo: form.memo.trim(),
      });
      setSuccess('Payment recorded successfully');
      setForm({
        billId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        memo: '',
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--color-danger)', fontSize: '1.2rem' }}>&#8593;</span>
        Make Payment
      </h3>

      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label form-label--required">Unpaid Bill</label>
          <select className="form-select" name="billId" value={form.billId} onChange={handleChange}>
            <option value="">-- Select Bill --</option>
            {bills.map((bill) => {
              const billNum = bill.bill_number || bill.billNumber || `#${bill.id}`;
              const supplier = bill.supplier_name || bill.supplierName || 'Unknown';
              const outstanding = Number(bill.total || 0) - Number(bill.amount_paid || 0);
              return (
                <option key={bill.id} value={bill.id}>
                  {billNum} — {supplier} — {formatGBP(outstanding > 0 ? outstanding : bill.total)}
                </option>
              );
            })}
          </select>
          {bills.length === 0 && (
            <p className="form-hint">No unpaid bills found.</p>
          )}
        </div>

        <div className="form-row">
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
            <label className="form-label form-label--required">Payment Date</label>
            <input
              className="form-input"
              type="date"
              name="paymentDate"
              value={form.paymentDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Memo</label>
          <input
            className="form-input"
            name="memo"
            value={form.memo}
            onChange={handleChange}
            placeholder="Optional note about this payment"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
          {saving ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}

/* ── Payments page ───────────────────────────────────────────────── */
export default function Payments() {
  const [activeTab, setActiveTab] = useState('receive');
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Fetch unpaid invoices and bills ───────────────────────────── */
  async function fetchData() {
    setLoading(true);
    try {
      const [invRes, billRes] = await Promise.all([
        api.get('/invoices?status=Sent').catch(() => ({ invoices: [] })),
        api.get('/bills?status=Unpaid').catch(() => ({ bills: [] })),
      ]);
      setInvoices(invRes.invoices || []);
      setBills(billRes.bills || []);
    } catch {
      // Individual errors handled inside
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'receive' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('receive')}
        >
          Receive Payment
        </button>
        <button
          className={`tab ${activeTab === 'make' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('make')}
        >
          Make Payment
        </button>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
            <div className="page-loader__spinner" />
            <p className="text-muted" style={{ marginTop: 16 }}>Loading payment data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Receive / Make Payment ──────────────────────────────── */}
          {activeTab === 'receive' ? (
            <ReceivePayment invoices={invoices} onSuccess={fetchData} />
          ) : (
            <MakePayment bills={bills} onSuccess={fetchData} />
          )}

          {/* ── Summary cards ──────────────────────────────────────── */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 24 }}>
            <div className="stat-card">
              <p className="stat-card__label">Unpaid Invoices</p>
              <p className="stat-card__value" style={{ fontSize: '1.5rem' }}>{invoices.length}</p>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                {formatGBP(invoices.reduce((sum, inv) => {
                  const outstanding = Number(inv.total || 0) - Number(inv.amount_paid || 0);
                  return sum + (outstanding > 0 ? outstanding : Number(inv.total || 0));
                }, 0))} outstanding
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Unpaid Bills</p>
              <p className="stat-card__value" style={{ fontSize: '1.5rem' }}>{bills.length}</p>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                {formatGBP(bills.reduce((sum, bill) => {
                  const outstanding = Number(bill.total || 0) - Number(bill.amount_paid || 0);
                  return sum + (outstanding > 0 ? outstanding : Number(bill.total || 0));
                }, 0))} outstanding
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
