import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const today = () => new Date().toISOString().slice(0, 10);
const in30Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const VAT_RATES = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '20%', value: 20 },
];

const emptyLine = () => ({
  key: Date.now() + Math.random(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  vatRate: 20,
  productId: '',
});

/* ── Invoice Form (Create / Edit) ─────────────────────────────────── */
export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  /* ── Form state ─────────────────────────────────────────────────── */
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(in30Days());
  const [lines, setLines] = useState([emptyLine()]);
  const [note, setNote] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* ── Load customers ─────────────────────────────────────────────── */
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.get('/customers');
        setCustomers(res.customers || []);
      } catch {
        // Non-critical
      }
    }
    loadCustomers();
  }, []);

  /* ── Load existing invoice (edit mode) ──────────────────────────── */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    async function loadInvoice() {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        const inv = res.invoice || res;
        if (cancelled) return;

        setInvoiceNumber(inv.invoiceNumber || inv.invoice_number || '');
        setCustomerId(String(inv.customerId || inv.customer_id || ''));
        setInvoiceDate((inv.invoiceDate || inv.invoice_date || '').slice(0, 10));
        setDueDate((inv.dueDate || inv.due_date || '').slice(0, 10));
        setNote(inv.note || inv.notes || '');

        const existingLines = inv.lines || inv.items || [];
        if (existingLines.length > 0) {
          setLines(
            existingLines.map((l) => ({
              key: Date.now() + Math.random(),
              description: l.description || '',
              quantity: Number(l.quantity) || 1,
              unitPrice: Number(l.unitPrice || l.unit_price) || 0,
              vatRate: Number(l.vatRate ?? l.vat_rate ?? 20),
              productId: l.productId || l.product_id || '',
            }))
          );
        }

        // Pre-fill customer search text
        const cName = inv.customerName || inv.customer_name || '';
        if (cName) setCustomerSearch(cName);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load invoice');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInvoice();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  /* ── Auto-fetch next invoice number (new mode) ──────────────────── */
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;

    async function fetchNextNumber() {
      try {
        const res = await api.get('/invoices/next-number?prefix=INV-');
        if (!cancelled) setInvoiceNumber(res.nextInvoiceNumber || '');
      } catch {
        // Fallback — user can type manually
      }
    }
    fetchNextNumber();
    return () => { cancelled = true; };
  }, [isEdit]);

  /* ── Filtered customer list for searchable dropdown ─────────────── */
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  function selectCustomer(c) {
    setCustomerId(String(c.id));
    setCustomerSearch(c.name || c.company || `Customer #${c.id}`);
    setShowCustomerDropdown(false);
  }

  /* ── Line item helpers ──────────────────────────────────────────── */
  function updateLine(index, field, value) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  /* ── Totals ─────────────────────────────────────────────────────── */
  const lineTotal = (line) => {
    const net = Number(line.quantity || 0) * Number(line.unitPrice || 0);
    return net;
  };

  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const vatTotal = lines.reduce((sum, l) => {
    const net = lineTotal(l);
    return sum + net * (Number(l.vatRate || 0) / 100);
  }, 0);
  const grandTotal = subtotal + vatTotal;

  /* ── Save ───────────────────────────────────────────────────────── */
  async function handleSave(sendAfterSave = false) {
    // Validation
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }
    if (lines.length === 0 || lines.every((l) => !l.description.trim())) {
      setError('Please add at least one line item with a description.');
      return;
    }

    const body = {
      customerId: Number(customerId),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
        vatRate: Number(l.vatRate) || 0,
        ...(l.productId ? { productId: Number(l.productId) } : {}),
      })),
      note: note.trim() || undefined,
      ...(sendAfterSave ? { status: 'Sent' } : {}),
    };

    try {
      setSaving(true);
      setError(null);

      if (isEdit) {
        await api.put(`/invoices/${id}`, body);
      } else {
        await api.post('/invoices', body);
      }

      navigate('/invoices');
    } catch (err) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
        <Link to="/invoices" className="btn btn-outline">Back to Invoices</Link>
      </div>

      {/* ── Error banner ────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* ── Invoice details ─────────────────────────────────────────── */}
      <div className="card">
        <h3 className="card-title">Invoice Details</h3>

        <div className="form-grid form-grid-2">
          {/* Invoice Number */}
          <div className="form-group">
            <label className="form-label">Invoice Number</label>
            <input
              type="text"
              className="input"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-0001"
            />
          </div>

          {/* Customer (searchable dropdown) */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Customer</label>
            <input
              type="text"
              className="input"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                if (!e.target.value.trim()) setCustomerId('');
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => {
                // Delay to allow click on dropdown item
                setTimeout(() => setShowCustomerDropdown(false), 200);
              }}
              placeholder="Search customers..."
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="dropdown-menu">
                {filteredCustomers.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    className={`dropdown-item ${String(c.id) === customerId ? 'active' : ''}`}
                    onMouseDown={() => selectCustomer(c)}
                  >
                    <span className="dropdown-item-name">{c.name || c.company || `Customer #${c.id}`}</span>
                    {c.email && <span className="dropdown-item-sub">{c.email}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Date */}
          <div className="form-group">
            <label className="form-label">Invoice Date</label>
            <input
              type="date"
              className="input"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Line items ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Line Items</h3>

        <div className="table-responsive">
          <table className="table line-items-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Description</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }}>Unit Price</th>
                <th style={{ width: '12%' }}>VAT Rate</th>
                <th style={{ width: '15%' }} className="text-right">Line Total</th>
                <th style={{ width: '8%' }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.key}>
                  <td>
                    <input
                      type="text"
                      className="input"
                      value={line.description}
                      onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input text-right"
                      min="0"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input text-right"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={line.vatRate}
                      onChange={(e) => updateLine(idx, 'vatRate', Number(e.target.value))}
                    >
                      {VAT_RATES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right">{formatGBP(lineTotal(line))}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger-outline"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length <= 1}
                      title="Remove line"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn btn-outline" onClick={addLine} style={{ marginTop: '0.75rem' }}>
          + Add Line
        </button>

        {/* ── Totals ────────────────────────────────────────────────── */}
        <div className="totals-section">
          <div className="totals-row">
            <span className="totals-label">Subtotal</span>
            <span className="totals-value">{formatGBP(subtotal)}</span>
          </div>
          <div className="totals-row">
            <span className="totals-label">VAT</span>
            <span className="totals-value">{formatGBP(vatTotal)}</span>
          </div>
          <div className="totals-row totals-grand">
            <span className="totals-label">Grand Total</span>
            <span className="totals-value">{formatGBP(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Notes / Terms ───────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Notes / Terms</h3>
        <textarea
          className="input textarea"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Payment terms, special notes, etc."
        />
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="form-actions" style={{ marginTop: '1.5rem' }}>
        <Link to="/invoices" className="btn btn-outline">Cancel</Link>
        <div className="form-actions-right">
          <button
            className="btn btn-outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
