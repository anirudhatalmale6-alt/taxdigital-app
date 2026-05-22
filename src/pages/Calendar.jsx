import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';

/* ── Helpers ──────────────────────────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const JOB_TYPES = ['Installation', 'Repair', 'Service', 'Inspection', 'Emergency', 'Other'];
const RECURRENCE_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly'];

const STATUS_BADGE = {
  Scheduled: 'badge--info',
  'In Progress': 'badge--warning',
  Completed: 'badge--success',
  Cancelled: 'badge--danger',
};

function pad(n) { return String(n).padStart(2, '0'); }

function toLocalDatetime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const EMPTY_FORM = {
  title: '',
  customerId: '',
  engineerId: '',
  description: '',
  jobType: 'Installation',
  status: 'Scheduled',
  startTime: '',
  endTime: '',
  address: '',
  notes: '',
  recurrence: 'None',
};

/* ── Component ────────────────────────────────────────────────────── */
export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const [jobs, setJobs] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Filters */
  const [filterEngineer, setFilterEngineer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Data fetching ──────────────────────────────────────────────── */
  const monthParam = `${year}-${pad(month + 1)}`;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ month: monthParam });
      if (filterEngineer) params.append('engineerId', filterEngineer);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/jobs?${params}`);
      setJobs(res.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [monthParam, filterEngineer, filterStatus]);

  const fetchEngineers = useCallback(async () => {
    try {
      const res = await api.get('/engineers');
      setEngineers(res.engineers || []);
    } catch { /* silent */ }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.customers || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { fetchEngineers(); fetchCustomers(); }, [fetchEngineers, fetchCustomers]);

  /* ── Calendar grid computation ──────────────────────────────────── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday = 0 in our grid
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days = [];

    // Leading days from previous month
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLast - i);
      days.push({ date: d, currentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), currentMonth: true });
    }

    // Trailing days to fill remaining row(s)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        days.push({ date: new Date(year, month + 1, d), currentMonth: false });
      }
    }

    return days;
  }, [year, month]);

  /* Map jobs to date keys */
  const jobsByDate = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      if (!job.start_time) return;
      const key = dateKey(new Date(job.start_time));
      if (!map[key]) map[key] = [];
      map[key].push(job);
    });
    return map;
  }, [jobs]);

  /* Engineer color lookup */
  const engineerMap = useMemo(() => {
    const m = {};
    engineers.forEach((e) => { m[e.id] = e; });
    return m;
  }, [engineers]);

  /* ── Navigation ─────────────────────────────────────────────────── */
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  /* ── Modal helpers ──────────────────────────────────────────────── */
  function openAddJob(date) {
    const dt = date || new Date();
    const start = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T09:00`;
    const end = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T10:00`;
    setEditingJob(null);
    setForm({ ...EMPTY_FORM, startTime: start, endTime: end });
    setFormError(null);
    setModalOpen(true);
  }

  function openEditJob(job) {
    setEditingJob(job);
    setForm({
      title: job.title || '',
      customerId: job.customer_id || '',
      engineerId: job.engineer_id || '',
      description: job.description || '',
      jobType: job.job_type || 'Installation',
      status: job.status || 'Scheduled',
      startTime: toLocalDatetime(job.start_time),
      endTime: toLocalDatetime(job.end_time),
      address: job.address || '',
      notes: job.notes || '',
      recurrence: job.recurrence || 'None',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingJob(null);
    setFormError(null);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.startTime) { setFormError('Start time is required'); return; }

    const body = {
      title: form.title.trim(),
      customerId: form.customerId || null,
      engineerId: form.engineerId || null,
      description: form.description.trim(),
      jobType: form.jobType,
      status: form.status,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      address: form.address.trim(),
      notes: form.notes.trim(),
      recurrence: form.recurrence === 'None' ? null : form.recurrence,
    };

    try {
      setSaving(true);
      setFormError(null);
      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, body);
      } else {
        await api.post('/jobs', body);
      }
      closeModal();
      fetchJobs();
    } catch (err) {
      setFormError(err.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.del(`/jobs/${deleteTarget.id}`);
      setDeleteTarget(null);
      closeModal();
      fetchJobs();
    } catch (err) {
      setFormError(err.message || 'Failed to delete job');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Calendar</h1>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => openAddJob(new Date())}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Job
          </button>
        </div>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      {/* ── Toolbar: Nav + Filters ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn--secondary btn--sm" onClick={prevMonth} title="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', minWidth: 170, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </span>
            <button className="btn btn--secondary btn--sm" onClick={nextMonth} title="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button className="btn btn--ghost btn--sm" onClick={goToday} style={{ marginLeft: 4 }}>Today</button>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={filterEngineer}
              onChange={(e) => setFilterEngineer(e.target.value)}
              style={{ minWidth: 160, padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value="">All Engineers</option>
              {engineers.filter((e) => e.is_active).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: 140, padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Calendar Grid ───────────────────────────────────────────── */}
      <div className="card card--flush" style={{ overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}>
          {DAYS.map((d) => (
            <div key={d} style={{
              padding: '10px 8px',
              textAlign: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-secondary)',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div className="page-loader__spinner" style={{ margin: '0 auto 12px' }} />
            Loading jobs...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: 'minmax(110px, auto)',
          }}>
            {calendarDays.map((dayObj, idx) => {
              const key = dateKey(dayObj.date);
              const dayJobs = jobsByDate[key] || [];
              const isToday = isSameDay(dayObj.date, today);
              const isCurrentMonth = dayObj.currentMonth;

              return (
                <div
                  key={idx}
                  onClick={() => isCurrentMonth && openAddJob(dayObj.date)}
                  style={{
                    padding: '6px 8px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--color-border-light)' : 'none',
                    borderBottom: '1px solid var(--color-border-light)',
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    background: isToday
                      ? 'var(--color-primary-50)'
                      : !isCurrentMonth
                        ? 'var(--color-bg)'
                        : 'var(--color-surface)',
                    minHeight: 110,
                    transition: 'background var(--transition)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => { if (isCurrentMonth && !isToday) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { if (isCurrentMonth && !isToday) e.currentTarget.style.background = 'var(--color-surface)'; }}
                >
                  {/* Date number */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 4,
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isToday ? 28 : 'auto',
                      height: isToday ? 28 : 'auto',
                      borderRadius: '50%',
                      background: isToday ? 'var(--color-primary)' : 'transparent',
                      color: isToday
                        ? '#fff'
                        : isCurrentMonth
                          ? 'var(--color-text)'
                          : 'var(--color-text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: isToday ? 700 : 500,
                    }}>
                      {dayObj.date.getDate()}
                    </span>
                  </div>

                  {/* Job pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayJobs.slice(0, 3).map((job) => {
                      const eng = engineerMap[job.engineer_id];
                      const color = eng?.colour || eng?.color || '#6b7280';
                      return (
                        <div
                          key={job.id}
                          onClick={(e) => { e.stopPropagation(); openEditJob(job); }}
                          title={`${job.title}${eng ? ` - ${eng.name}` : ''}`}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#fff',
                            background: color,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            lineHeight: 1.5,
                            transition: 'opacity var(--transition)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                        >
                          {job.title}
                        </div>
                      );
                    })}
                    {dayJobs.length > 3 && (
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        paddingLeft: 2,
                      }}>
                        +{dayJobs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Engineer Legend ──────────────────────────────────────────── */}
      {engineers.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Engineers
            </span>
            {engineers.filter((e) => e.is_active).map((eng) => (
              <div key={eng.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: eng.colour || eng.color || '#6b7280',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  {eng.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Job Modal ───────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editingJob ? 'Edit Job' : 'New Job'}</h3>
              <button className="modal__close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal__body">
                {formError && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{formError}</div>}

                {/* Title */}
                <div className="form-group">
                  <label className="form-label form-label--required">Title</label>
                  <input className="form-input" value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Job title" />
                </div>

                {/* Customer + Engineer row */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer</label>
                    <select className="form-select" value={form.customerId} onChange={(e) => updateForm('customerId', e.target.value)}>
                      <option value="">-- Select Customer --</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Engineer</label>
                    <select className="form-select" value={form.engineerId} onChange={(e) => updateForm('engineerId', e.target.value)}>
                      <option value="">-- Select Engineer --</option>
                      {engineers.filter((e) => e.is_active).map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Job Type + Status */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select className="form-select" value={form.jobType} onChange={(e) => updateForm('jobType', e.target.value)}>
                      {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Start / End times */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label form-label--required">Start Date/Time</label>
                    <input type="datetime-local" className="form-input" value={form.startTime} onChange={(e) => updateForm('startTime', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date/Time</label>
                    <input type="datetime-local" className="form-input" value={form.endTime} onChange={(e) => updateForm('endTime', e.target.value)} />
                  </div>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Job site address" />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows="2" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Job description" />
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows="2" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Internal notes" />
                </div>

                {/* Recurrence */}
                <div className="form-group">
                  <label className="form-label">Recurrence</label>
                  <select className="form-select" value={form.recurrence} onChange={(e) => updateForm('recurrence', e.target.value)}>
                    {RECURRENCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Status badge preview for edit mode */}
                {editingJob && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Status:</span>
                    <span className={`badge ${STATUS_BADGE[form.status] || 'badge--neutral'}`}>{form.status}</span>
                  </div>
                )}
              </div>

              <div className="modal__footer">
                {editingJob && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    style={{ marginRight: 'auto' }}
                    onClick={() => setDeleteTarget(editingJob)}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="btn btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Delete Job</h3>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
