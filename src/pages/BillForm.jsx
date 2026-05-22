import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const formatGBP = (value) =>
  Number(value || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const EMPTY_LINE = { description: '', quantity: 1, unitCost: 0, vatRate: 20 };

/* ── Bill form (create / edit) ───────────────────────────────────── */
export default function BillForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    billNumber: '',
    supplierId: '',
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
  });

  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

  /* ── Load data ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Load suppliers
        const supRes = await api.get('/suppliers');
        if (!cancelled) setSuppliers(supRes.suppliers || []);

        if (isEdit) {
          // Load existing bill
          const data = await api.get(`/bills/${id}`);
          const bill = data.bill || data;
          if (!cancelled) {
            setForm({
              billNumber: bill.bill_number || bill.billNumber || '',
              supplierId: String(bill.supplier_id || bill.supplierId || ''),
              billDate: (bill.bill_date || bill.billDate || '').slice(0, 10),
              dueDate: (bill.due_date || bill.dueDate || '').slice(0, 10),
            });
            if (bill.lines && bill.lines.length > 0) {
              setLines(
                bill.lines.map((l) => ({
                  description: l.description || '',
                  quantity: Number(l.quantity || 1),
                  unitCost: Number(l.unit_cost ?? l.unitCost ?? 0),
                  vatRate: Number(l.vat_rate ?? l.vatRate ?? 20),
                  productId: l.product_id || l.productId || undefined,
                }))
              );
            }
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
      const lineTotal = Number(line.quantity) * Number(line.unitCost);
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

    if (!form.supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (lines.every((l) => !l.description.trim())) {
      setError('Please add at least one line item with a description.');
      return;
    }

    const payload = {
      supplierId: Number(form.supplierId),
      billNumber: form.billNumber,
      billDate: form.billDate,
      dueDate: form.dueDate,
      lines: lines.map((l) => {
        const lineData = {
          description: l.description,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
          vatRate: Number(l.vatRate),
        };
        if (l.productId) lineData.productId = l.productId;
        return lineData;
      }),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/bills/${id}`, payload);
      } else {
        await api.post('/bills', payload);
      }
      navigate('/bills');
    } catch (err) {
      setError(err.message || 'Failed to save bill');
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
        <h1 className="page-title">{isEdit ? 'Edit Bill' : 'New Bill'}</h1>
        <Link to="/bills" className="btn btn-outline">Back to Bills</Link>
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
          <h3 className="card-title">Bill Details</h3>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Bill Number</label>
              <input
                type="text"
                className="input"
                value={form.billNumber}
                onChange={(e) => handleFormChange('billNumber', e.target.value)}
                placeholder="BILL-0001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select
                className="input"
                value={form.supplierId}
                onChange={(e) => handleFormChange('supplierId', e.target.value)}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.company || `Supplier #${s.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Bill Date</label>
              <input
                type="date"
                className="input"
                value={form.billDate}
                onChange={(e) => handleFormChange('billDate', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
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
                  <th style={{ width: '15%' }}>Unit Cost</th>
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
                        value={line.unitCost}
                        onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
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

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="form-actions">
          <Link to="/bills" className="btn btn-outline">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Bill' : 'Save Bill'}
          </button>
        </div>
      </form>
    </div>
  );
}
