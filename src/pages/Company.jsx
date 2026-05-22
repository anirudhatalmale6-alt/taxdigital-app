import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function Company() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    postalCode: '',
    vrn: '',
    companyReg: '',
    utr: '',
    invoicePrefix: '',
    currencyCode: '',
    currencySymbol: '',
    paymentDetails: '',
    gasSafeNumber: '',
    logoUrl: '',
  });

  /* ── Fetch company ──────────────────────────────────────────────── */
  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company');
      setForm({
        name: res.name || '',
        businessName: res.business_name || '',
        email: res.email || '',
        phone: res.phone || '',
        website: res.website || '',
        address: res.address || '',
        postalCode: res.postal_code || '',
        vrn: res.vrn || '',
        companyReg: res.company_reg || '',
        utr: res.utr || '',
        invoicePrefix: res.invoice_prefix || '',
        currencyCode: res.currency_code || '',
        currencySymbol: res.currency_symbol || '',
        paymentDetails: res.payment_details || '',
        gasSafeNumber: res.gas_safe_number || '',
        logoUrl: res.logo_url || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  /* ── Save ────────────────────────────────────────────────────────── */
  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.put('/company', {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        vrn: form.vrn.trim(),
        companyReg: form.companyReg.trim(),
        utr: form.utr.trim(),
        invoicePrefix: form.invoicePrefix.trim(),
        currencyCode: form.currencyCode.trim(),
        currencySymbol: form.currencySymbol.trim(),
        paymentDetails: form.paymentDetails.trim(),
        gasSafeNumber: form.gasSafeNumber.trim(),
      });
      setSuccess('Company settings saved successfully.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save company settings');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /* ── Section heading helper ─────────────────────────────────────── */
  function SectionTitle({ children }) {
    return (
      <h3 style={{
        fontSize: '0.82rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)',
        marginBottom: 16,
        marginTop: 8,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-border-light)',
      }}>
        {children}
      </h3>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div className="page-loader__spinner" style={{ margin: '0 auto 12px' }} />
        Loading company settings...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Company Settings</h1>
        </div>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSave}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* ── Left column ────────────────────────────────────────── */}
          <div className="card">
            {/* Logo section */}
            <div style={{ marginBottom: 24 }}>
              <SectionTitle>Logo</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Company logo"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'contain',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      background: '#fff',
                      padding: 4,
                    }}
                  />
                ) : (
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius)',
                    border: '2px dashed var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                  }}>
                    No logo
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Logo appears on invoices and estimates
                  </p>
                  <p className="form-hint">Upload via your account dashboard</p>
                </div>
              </div>
            </div>

            {/* Basic info */}
            <SectionTitle>Basic Information</SectionTitle>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Your company name" />
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} placeholder="Trading name" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="info@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="+44 20 0000 0000" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://www.company.com" />
            </div>

            {/* Address */}
            <SectionTitle>Address</SectionTitle>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows="3" value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Full business address" />
            </div>

            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input className="form-input" value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value)} placeholder="SW1A 1AA" style={{ maxWidth: 200 }} />
            </div>
          </div>

          {/* ── Right column ───────────────────────────────────────── */}
          <div className="card">
            {/* Tax */}
            <SectionTitle>Tax &amp; Registration</SectionTitle>
            <div className="form-group">
              <label className="form-label">VAT Number (VRN)</label>
              <input className="form-input" value={form.vrn} onChange={(e) => updateForm('vrn', e.target.value)} placeholder="GB 000 0000 00" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company Registration</label>
                <input className="form-input" value={form.companyReg} onChange={(e) => updateForm('companyReg', e.target.value)} placeholder="00000000" />
              </div>
              <div className="form-group">
                <label className="form-label">UTR</label>
                <input className="form-input" value={form.utr} onChange={(e) => updateForm('utr', e.target.value)} placeholder="0000000000" />
              </div>
            </div>

            {/* Invoicing */}
            <SectionTitle>Invoicing</SectionTitle>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input className="form-input" value={form.invoicePrefix} onChange={(e) => updateForm('invoicePrefix', e.target.value)} placeholder="INV-" />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Code</label>
                <input className="form-input" value={form.currencyCode} onChange={(e) => updateForm('currencyCode', e.target.value)} placeholder="GBP" style={{ maxWidth: 120 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input className="form-input" value={form.currencySymbol} onChange={(e) => updateForm('currencySymbol', e.target.value)} placeholder="£" style={{ maxWidth: 80 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Details</label>
              <textarea className="form-textarea" rows="4" value={form.paymentDetails} onChange={(e) => updateForm('paymentDetails', e.target.value)} placeholder="Bank name, sort code, account number..." />
              <p className="form-hint">Displayed on invoices for customer payments</p>
            </div>

            {/* Trade */}
            <SectionTitle>Trade Certifications</SectionTitle>
            <div className="form-group">
              <label className="form-label">Gas Safe Number</label>
              <input className="form-input" value={form.gasSafeNumber} onChange={(e) => updateForm('gasSafeNumber', e.target.value)} placeholder="000000" style={{ maxWidth: 200 }} />
              <p className="form-hint">Gas Safe Register ID shown on gas work documents</p>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid var(--color-border)',
        }}>
          <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
            {saving ? (
              <>
                <div className="page-loader__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Saving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
