import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import './VerifyLandModal.css';

const VerifyLandModal = ({ property, user, onClose, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please upload a Proof Certificate (PDF)'); return; }
    
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('userId', localStorage.getItem('greon_userId'));
      formData.append('phoneNumber', phone);
      formData.append('proofCertificate', file);

      const res = await fetch(`http://localhost:3001/api/properties/${property.id}/verify`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="verify-modal-overlay" onClick={onClose}>
        <div className="verify-modal" onClick={e => e.stopPropagation()}>
          <div className="verify-success">
            <CheckCircle size={48} color="#10b981" />
            <h2>Verification Submitted!</h2>
            <p>Your application is now under review. You'll see the status update on your property card once a staff member reviews it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-modal-overlay" onClick={onClose}>
      <div className="verify-modal" onClick={e => e.stopPropagation()}>
        <div className="verify-modal-header">
          <h2>Verify Land Ownership</h2>
          <button className="verify-close" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="verify-desc">
          Submit your proof of ownership certificate from <strong>e-Albania</strong> (the official government portal). A staff member will review your application.
        </p>

        {error && <div className="verify-error">{error}</div>}

        <form onSubmit={handleSubmit} className="verify-form">
          {/* Pre-filled fields */}
          <div className="verify-field-group">
            <label>Full Name</label>
            <input type="text" value={user?.name || ''} disabled className="verify-input disabled" />
          </div>

          <div className="verify-field-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled className="verify-input disabled" />
          </div>

          <div className="verify-field-group">
            <label>Land Address</label>
            <input type="text" value={property?.address || ''} disabled className="verify-input disabled" />
          </div>

          {/* Editable fields */}
          <div className="verify-field-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+355 6X XXX XXXX"
              className="verify-input"
            />
          </div>

          {/* File upload */}
          <div className="verify-field-group">
            <label>Proof Certificate (PDF) <span className="required">*</span></label>
            <div className="verify-upload-area">
              {file ? (
                <div className="verify-file-preview">
                  <FileText size={20} />
                  <span>{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="verify-remove-file">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="verify-upload-label">
                  <Upload size={24} />
                  <span>Click to upload or drag & drop</span>
                  <span className="upload-hint">PDF only, max 10MB</span>
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    onChange={e => setFile(e.target.files[0])} 
                    hidden 
                  />
                </label>
              )}
            </div>
          </div>

          <button type="submit" className="verify-submit-btn" disabled={submitting}>
            {submitting ? <><Loader2 size={18} className="spinner" /> Submitting...</> : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyLandModal;
