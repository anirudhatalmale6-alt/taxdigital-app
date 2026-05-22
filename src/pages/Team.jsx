import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

const ROLE_BADGE = {
  owner: { className: 'badge--purple', label: 'Owner' },
  admin: { className: 'badge--info', label: 'Admin' },
  engineer: { className: 'badge--success', label: 'Engineer' },
  accountant: { className: 'badge--warning', label: 'Accountant' },
};

function RoleBadge({ role }) {
  const r = ROLE_BADGE[role] || { className: 'badge--neutral', label: role || 'Unknown' };
  return (
    <span
      className={`badge ${r.className}`}
      style={role === 'owner' ? { background: '#f3e8ff', color: '#7c3aed' } : undefined}
    >
      {r.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Invite modal */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('engineer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  /* Edit role modal */
  const [editTarget, setEditTarget] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('member'); // 'member' or 'invitation'
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch ────────────────────────────────────────────────────────── */
  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamRes, invRes] = await Promise.all([
        api.get('/team'),
        api.get('/team/invitations').catch(() => ({ invitations: [] })),
      ]);
      setMembers(teamRes.members || []);
      setInvitations(invRes.invitations || []);
    } catch (err) {
      setError(err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  /* ── Invite ───────────────────────────────────────────────────────── */
  function openInvite() {
    setInviteEmail('');
    setInviteRole('engineer');
    setInviteError(null);
    setInviteSuccess(null);
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
    setInviteError(null);
    setInviteSuccess(null);
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) { setInviteError('Email is required'); return; }

    try {
      setInviting(true);
      setInviteError(null);
      setInviteSuccess(null);
      const res = await api.post('/team/invite', { email: inviteEmail.trim(), role: inviteRole });
      setInviteSuccess(res.message || 'Invitation sent successfully');
      fetchTeam();
      setTimeout(() => closeInvite(), 2000);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  /* ── Edit role ────────────────────────────────────────────────────── */
  function openEdit(member) {
    setEditTarget(member);
    setEditRole(member.role || 'engineer');
    setEditError(null);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(null);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      setEditSaving(true);
      setEditError(null);
      await api.put(`/team/${editTarget.id}`, { role: editRole });
      closeEdit();
      fetchTeam();
    } catch (err) {
      setEditError(err.message || 'Failed to update role');
    } finally {
      setEditSaving(false);
    }
  }

  /* ── Delete ───────────────────────────────────────────────────────── */
  function confirmDeleteMember(member) {
    setDeleteTarget(member);
    setDeleteType('member');
  }

  function confirmCancelInvite(inv) {
    setDeleteTarget(inv);
    setDeleteType('invitation');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteType === 'member') {
        await api.del(`/team/members/${deleteTarget.id}`);
      } else {
        await api.del(`/team/invitations/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      fetchTeam();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Team</h1>
          {!loading && (
            <span className="badge badge--neutral" style={{ fontSize: '0.78rem' }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={openInvite}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Invite Member
          </button>
        </div>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div className="page-loader__spinner" style={{ margin: '0 auto 12px' }} />
          Loading team...
        </div>
      ) : (
        <>
          {/* ── Active Members ──────────────────────────────────────── */}
          <div className="card card--flush" style={{ marginBottom: 24 }}>
            <div className="card__header">
              <h3 className="card__title">Active Members</h3>
            </div>
            {members.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 24px' }}>
                <p className="text-muted">No team members found.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: m.role === 'owner' ? '#7c3aed'
                                : m.role === 'admin' ? 'var(--color-primary)'
                                : m.role === 'engineer' ? 'var(--color-success)'
                                : 'var(--color-warning)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              flexShrink: 0,
                            }}>
                              {(m.name || m.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{m.name || '--'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{m.email}</td>
                        <td><RoleBadge role={m.role} /></td>
                        <td>
                          <span className={`badge ${m.is_active ? 'badge--success' : 'badge--neutral'}`}>
                            {m.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                          {formatDate(m.created_at)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {m.role !== 'owner' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button className="btn btn--ghost btn--sm" onClick={() => openEdit(m)} title="Edit role">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button className="btn btn--ghost btn--sm" onClick={() => confirmDeleteMember(m)} title="Remove member">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pending Invitations ─────────────────────────────────── */}
          <div className="card card--flush">
            <div className="card__header">
              <h3 className="card__title">Pending Invitations</h3>
              {invitations.length > 0 && (
                <span className="badge badge--warning" style={{ fontSize: '0.72rem' }}>
                  {invitations.length} pending
                </span>
              )}
            </div>
            {invitations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No pending invitations
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Sent</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 500 }}>{inv.email}</td>
                        <td><RoleBadge role={inv.role} /></td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                          {formatDate(inv.created_at)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn--ghost btn--sm" onClick={() => confirmCancelInvite(inv)} title="Cancel invitation">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span style={{ color: 'var(--color-danger)' }}>Cancel</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Invite Modal ────────────────────────────────────────────── */}
      {inviteOpen && (
        <div className="modal-overlay" onClick={closeInvite}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Invite Team Member</h3>
              <button className="modal__close" onClick={closeInvite}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal__body">
                {inviteError && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{inviteError}</div>}
                {inviteSuccess && <div className="alert alert--success" style={{ marginBottom: 16 }}>{inviteSuccess}</div>}

                <div className="form-group">
                  <label className="form-label form-label--required">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label--required">Role</label>
                  <select className="form-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="engineer">Engineer</option>
                    <option value="accountant">Accountant</option>
                  </select>
                  <p className="form-hint">
                    {inviteRole === 'admin' && 'Full access to all features and settings'}
                    {inviteRole === 'engineer' && 'Access to calendar, jobs, and their own schedule'}
                    {inviteRole === 'accountant' && 'Access to invoices, bills, payments, and reports'}
                  </p>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeInvite}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Role Modal ─────────────────────────────────────────── */}
      {editTarget && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Edit Role</h3>
              <button className="modal__close" onClick={closeEdit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal__body">
                {editError && <div className="alert alert--danger" style={{ marginBottom: 16 }}>{editError}</div>}

                <p style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Change role for <strong style={{ color: 'var(--color-text)' }}>{editTarget.name || editTarget.email}</strong>
                </p>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="engineer">Engineer</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeEdit}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {deleteType === 'member' ? 'Remove Member' : 'Cancel Invitation'}
              </h3>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal__body">
              {deleteType === 'member' ? (
                <p>Are you sure you want to remove <strong>{deleteTarget.name || deleteTarget.email}</strong> from the team? They will lose access immediately.</p>
              ) : (
                <p>Cancel the invitation sent to <strong>{deleteTarget.email}</strong>?</p>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Keep</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing...' : deleteType === 'member' ? 'Remove' : 'Cancel Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
