import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Eye, Loader2 } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [noteId, setNoteId] = useState('');
  const [note, setNote] = useState('');

  const fetchVerifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verifications?userId=${localStorage.getItem('greon_userId')}`);
      const data = await res.json();
      if (res.ok) setVerifications(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchVerifications(); }, []);

  const handleAction = async (propId, status) => {
    setActionLoading(propId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verifications/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('greon_userId'),
          status,
          note: noteId === propId ? note : undefined
        })
      });
      if (res.ok) {
        setNote('');
        setNoteId('');
        fetchVerifications();
      }
    } catch { /* ignore */ }
    setActionLoading('');
  };

  const statusConfig = {
    in_review: { label: 'In Review', color: '#f59e0b', icon: <Clock size={14} /> },
    confirmed: { label: 'Confirmed', color: '#10b981', icon: <CheckCircle size={14} /> },
    declined: { label: 'Declined', color: '#ef4444', icon: <XCircle size={14} /> }
  };

  if (loading) return (
    <div className="admin-panel">
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Loader2 size={32} className="spinner" />
        <p style={{ marginTop: '12px', color: 'var(--color-text-muted)' }}>Loading verifications...</p>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Land Verification Review</h1>
        <p>Review and approve land ownership verification requests</p>
      </div>

      {verifications.length === 0 ? (
        <div className="admin-empty">
          <Clock size={48} color="var(--color-text-muted)" />
          <h3>No Verification Requests</h3>
          <p>All applications have been processed or none have been submitted yet.</p>
        </div>
      ) : (
        <div className="admin-list">
          {verifications.map(v => {
            const sc = statusConfig[v.verificationStatus] || statusConfig.in_review;
            return (
              <div key={v.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3>{v.name}</h3>
                    <span className="admin-address">{v.address}</span>
                  </div>
                  <span className="admin-status-badge" style={{ background: sc.color + '18', color: sc.color, borderColor: sc.color + '40' }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                <div className="admin-details">
                  <div className="admin-detail"><strong>Owner:</strong> {v.user?.name}</div>
                  <div className="admin-detail"><strong>Email:</strong> {v.user?.email}</div>
                  <div className="admin-detail"><strong>Phone:</strong> {v.phoneNumber || 'N/A'}</div>
                  <div className="admin-detail"><strong>Coords:</strong> {v.lat?.toFixed(5)}, {v.lng?.toFixed(5)}</div>
                  <div className="admin-detail"><strong>Submitted:</strong> {v.verificationSubmittedAt ? new Date(v.verificationSubmittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                </div>

                {v.proofCertificatePath && (
                  <a href={`${import.meta.env.VITE_API_URL}/uploads/${v.proofCertificatePath}`} target="_blank" rel="noopener noreferrer" className="admin-pdf-link">
                    <FileText size={16} /> View Proof Certificate
                  </a>
                )}

                {v.verificationNote && (
                  <div className="admin-note">
                    <strong>Note:</strong> {v.verificationNote}
                  </div>
                )}

                {v.verificationStatus === 'in_review' && (
                  <div className="admin-actions">
                    {noteId === v.id ? (
                      <input
                        type="text"
                        placeholder="Optional note (e.g. reason for decline)..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="admin-note-input"
                      />
                    ) : (
                      <button className="admin-action-note" onClick={() => setNoteId(v.id)}>+ Add Note</button>
                    )}
                    <div className="admin-action-btns">
                      <button
                        className="admin-btn approve"
                        onClick={() => handleAction(v.id, 'confirmed')}
                        disabled={actionLoading === v.id}
                      >
                        {actionLoading === v.id ? <Loader2 size={14} className="spinner" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        className="admin-btn decline"
                        onClick={() => handleAction(v.id, 'declined')}
                        disabled={actionLoading === v.id}
                      >
                        {actionLoading === v.id ? <Loader2 size={14} className="spinner" /> : <XCircle size={14} />}
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
