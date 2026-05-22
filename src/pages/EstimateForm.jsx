import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const EMPTY_LINE = { description: '', quantity: 1, unitPrice: 0, vatRate: 20 };

/* ── Estimate form (create / edit) ───────────────────────────────── */
export default function EstimateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    estimateNumber: '',
    customerId: '',
    reference: '',
    estimateDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    notes: '',
    terms: '',
  });

  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

  /* ── Load data ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Load customers
        const custRes = await api.get('/customers');
        if (!cancelled) setCustomers(custRes.customers || []);

        if (isEdit) {
          // Load existing estimate
          const data = await api.get(`/estimates/${id}`);
          const est = data.estimate || data;
          if (!cancelled) {
            setForm({
              estimateNumber: est.estimate_number || est.estimateNumber || '',
              customerId: String(est.customer_id || est.customerId || ''),
              reference: est.reference || '',
              estimateDate: (est.estimate_date || est.estimateDate || '').slice(0, 10),
              expiryDate: (est.expiry_date || est.expiryDate || '').slice(0, 10),
              notes: est.notes || '',
              terms: est.terms || '',
            });
            if (est.lines && est.lines.length > 0) {
              setLines(
                est.lines.map((l) => ({
                  description: l.description || '',
                  quantity: Number(l.quantity || 1),
                  unitPrice: Number(l.unit_price ?? l.unitPrice ?? 0),
                  vatRate: Number(l.vat_rate ?? l.vatRate ?? 20),
                }))
              );
            }
          }
        } else {
          // Get next estimate number
          try {
            const numRes = await api.get('/estimates/next-number?prefix=EST-');
            if (!cancelled) {
              setForm((prev) => ({ ...prev, estimateNumber: numRes.nextNumber || '' }));
            }
          } catch {
            // Non-critical — user can type manually
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  /* ── Line item calculations ────────────────────────────────────── */
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalVat = 0;

    const computed = lines.map((line) => {
      const lineTotal = Number(line.quantity) * Number(line.unitPrice);
      const lineVat = lineTotal * (Number(line.vatRate) / 100);
      subtotal += lineTotal;
      totalVat += lineVat;
      return { ...line, lineTotal, lineVat };
    });

    return { lines: computed, subtotal, totalVat, grandTotal: subtotal + totalVat };
  }, [lines]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleLineChange(index, field, value) {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.customerId) {
      setError('Please select a customer.');
      return;
    }
    if (lines.every((l) => !l.description.trim())) {
      setError('Please add at least one line item with a description.');
      return;
    }

    const payload = {
      customerId: Number(form.customerId),
      estimateNumber: form.estimateNumber,
      reference: form.reference,
      estimateDate: form.estimateDate,
      expiryDate: form.expiryDate,
      lines: lines.map((l, i) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        vatRate: Number(l.vatRate),
        sortOrder: i + 1,
      })),
      notes: form.notes,
      terms: form.terms,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/estimates/${id}`, payload);
      } else {
        await api.post('/estimates', payload);
      }
      navigate('/estimates');
    } catch (err) {
      setError(err.message || 'Failed to save estimate');
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Estimate' : 'New Estimate'}</h1>
        <Link to="/estimates" className="btn btn-outline">Back to Estimates</Link>
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="card error-card">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Details ─────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="card-title">Estimate Details</h3>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label">Estimate Number</label>
              <input
                type="text"
                className="input"
                value={form.estimateNumber}
                onChange={(e) => handleFormChange('estimateNumber', e.target.value)}
                placeholder="EST-0001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Customer</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                required
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.company || `Customer #${c.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reference</label>
              <input
                type="text"
                className="input"
                value={form.reference}
                onChange={(e) => handleFormChange('reference', e.target.value)}
                placeholder="Optional reference"
              />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Estimate Date</label>
              <input
                type="date"
                className="input"
                value={form.estimateDate}
                onChange={(e) => handleFormChange('estimateDate', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input
                type="date"
                className="input"
                value={form.expiryDate}
                onChange={(e) => handleFormChange('expiryDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Line Items ──────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="card-title">Line Items</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Description</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '12%' }}>VAT %</th>
                  <th style={{ width: '15%' }} className="text-right">Total</th>
                  <th style={{ width: '8%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="input"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        value={line.vatRate}
                        onChange={(e) => handleLineChange(index, 'vatRate', e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="20">20%</option>
                      </select>
                    </td>
                    <td className="text-right">
                      {formatGBP(totals.lines[index]?.lineTotal || 0)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 1}
                        title="Remove line"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="btn btn-outline" onClick={addLine} style={{ marginTop: '0.75rem' }}>
            + Add Line
          </button>

          {/* ── Totals ──────────────────────────────────────────────────── */}
          <div className="totals-section">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatGBP(totals.subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>VAT</span>
              <span>{formatGBP(totals.totalVat)}</span>
            </div>
            <div className="totals-row totals-grand">
              <span>Total</span>
              <span>{formatGBP(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Notes & Terms ───────────────────────────────────────────── */}
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="input"
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows="3"
                placeholder="Notes visible to customer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Terms</label>
              <textarea
                className="input"
                value={form.terms}
                onChange={(e) => handleFormChange('terms', e.target.value)}
                rows="3"
                placeholder="Terms and conditions"
              />
            </div>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="form-actions">
          <Link to="/estimates" className="btn btn-outline">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Estimate' : 'Save Estimate'}
          </button>
        </div>
      </form>
    </div>
  );
}
