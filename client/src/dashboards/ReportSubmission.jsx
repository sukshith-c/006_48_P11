import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, PriorityBadge } from '../components/Badges';
import { FileText, CheckCircle, XCircle, Info, Loader, AlertTriangle } from 'lucide-react';

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const VIOLATION_CODES = [
  'V01-CRITICAL', 'V02-CRITICAL', 'V03-MAJOR', 'V04-MAJOR',
  'V05-MINOR', 'V06-MINOR', 'V07-ADVISORY', 'V08-ADVISORY',
  'V09-PASSED', 'V10-PASSED'
];

const initialForm = {
  inspectorName: '', inspectorId: '', contactNumber: '',
  establishmentName: '', establishmentAddress: '', pinCode: '', inspectionDate: '',
  violationCode: '', violationDescription: '', observations: '', urgencyLevel: 'medium'
};

const ReportSubmission = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [liveValidation, setLiveValidation] = useState({});

  const validateField = (name, value) => {
    if (name === 'inspectorId') {
      const valid = /^INS[A-Z]{2}[0-9]{4}$/i.test(value);
      setLiveValidation(p => ({ ...p, inspectorId: valid ? 'valid' : value.length > 0 ? 'invalid' : '' }));
      return valid || value.length === 0 ? '' : 'Format: INS[2 letters][4 digits] e.g. INSAB1234';
    }
    if (name === 'violationCode') {
      const valid = /^V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)$/i.test(value);
      setLiveValidation(p => ({ ...p, violationCode: valid ? 'valid' : value.length > 0 ? 'invalid' : '' }));
      return valid || value.length === 0 ? '' : 'Format: V[2 digits]-[CATEGORY] e.g. V01-CRITICAL';
    }
    if (name === 'pinCode') {
      return /^[0-9]{6}$/.test(value) || value.length === 0 ? '' : 'PIN code must be 6 digits';
    }
    if (name === 'contactNumber') {
      return /^[0-9]{10}$/.test(value) || value.length === 0 ? '' : 'Enter valid 10-digit number';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    const err = validateField(name, value);
    setErrors(p => ({ ...p, [name]: err }));
  };

  const validateAll = () => {
    const e = {};
    if (!form.inspectorName) e.inspectorName = 'Required';
    if (!form.inspectorId) e.inspectorId = 'Required';
    else if (!/^INS[A-Z]{2}[0-9]{4}$/i.test(form.inspectorId)) e.inspectorId = 'Invalid format: INS[2 letters][4 digits]';
    if (!form.contactNumber) e.contactNumber = 'Required';
    else if (!/^[0-9]{10}$/.test(form.contactNumber)) e.contactNumber = 'Must be 10 digits';
    if (!form.establishmentName) e.establishmentName = 'Required';
    if (!form.establishmentAddress) e.establishmentAddress = 'Required';
    if (!form.pinCode) e.pinCode = 'Required';
    else if (!/^[0-9]{6}$/.test(form.pinCode)) e.pinCode = 'Must be 6 digits';
    if (!form.inspectionDate) e.inspectionDate = 'Required';
    if (!form.violationCode) e.violationCode = 'Required';
    else if (!/^V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)$/i.test(form.violationCode)) e.violationCode = 'Invalid format';
    if (!form.violationDescription) e.violationDescription = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length) { setErrors(errs); addToast('Please fix form errors', 'error'); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await reportsAPI.submit(form);
      setResult(data);
      addToast(`Report ${data.report.reportId} submitted successfully!`, 'success');
      setForm(initialForm);
      setLiveValidation({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      addToast(msg, 'error');
      if (err.response?.data?.validationResult) {
        setResult({ error: true, ...err.response.data });
      }
    } finally {
      setLoading(false);
    }
  };

  const LiveIndicator = ({ field }) => {
    const v = liveValidation[field];
    if (!v) return null;
    return v === 'valid'
      ? <span style={{ color: '#16a34a', fontSize: 12, marginLeft: 6 }}>✓ Valid</span>
      : <span style={{ color: '#dc2626', fontSize: 12, marginLeft: 6 }}>✗ Invalid</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>📋 Submit Inspection Report</h2>
          <p>Complete the form below to submit a food safety inspection report</p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Info size={16} />
        <span>Inspector ID format: <strong>INS[2 uppercase letters][4 digits]</strong> (e.g. INSAB1234) &nbsp;|&nbsp;
        Violation Code format: <strong>V[2 digits]-[CATEGORY]</strong> (e.g. V01-CRITICAL)</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Inspector Information */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title"><span>👤</span> Inspector Information</div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Inspector Name <span className="required">*</span></label>
                <input className={`form-input ${errors.inspectorName ? 'error' : ''}`} name="inspectorName"
                  value={form.inspectorName} onChange={handleChange} placeholder="Full Name" />
                {errors.inspectorName && <div className="form-error">⚠ {errors.inspectorName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Inspector ID <span className="required">*</span> <LiveIndicator field="inspectorId" /></label>
                <input className={`form-input ${errors.inspectorId ? 'error' : liveValidation.inspectorId === 'valid' ? '' : ''}`}
                  name="inspectorId" value={form.inspectorId} onChange={handleChange}
                  placeholder="INSAB1234" maxLength={9} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
                <div className="form-hint">Format: INS + 2 letters + 4 digits</div>
                {errors.inspectorId && <div className="form-error">⚠ {errors.inspectorId}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number <span className="required">*</span></label>
              <input className={`form-input ${errors.contactNumber ? 'error' : ''}`} name="contactNumber"
                value={form.contactNumber} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} />
              {errors.contactNumber && <div className="form-error">⚠ {errors.contactNumber}</div>}
            </div>
          </div>
        </div>

        {/* Establishment Information */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title"><span>🏪</span> Establishment Information</div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Restaurant / Processing Unit Name <span className="required">*</span></label>
                <input className={`form-input ${errors.establishmentName ? 'error' : ''}`} name="establishmentName"
                  value={form.establishmentName} onChange={handleChange} placeholder="e.g. Hotel Taj, Ramesh Foods Pvt Ltd" />
                {errors.establishmentName && <div className="form-error">⚠ {errors.establishmentName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code <span className="required">*</span></label>
                <input className={`form-input ${errors.pinCode ? 'error' : ''}`} name="pinCode"
                  value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN (e.g. 560001)" maxLength={6} />
                <div className="form-hint">Zones: 56xxxx=Z1, 57xxxx=Z2, 58xxxx=Z3, 59xxxx=Z4, 60xxxx=Z5, 61xxxx=Z6</div>
                {errors.pinCode && <div className="form-error">⚠ {errors.pinCode}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address <span className="required">*</span></label>
              <textarea className={`form-textarea ${errors.establishmentAddress ? 'error' : ''}`} name="establishmentAddress"
                value={form.establishmentAddress} onChange={handleChange} placeholder="Full address of the establishment" rows={2} />
              {errors.establishmentAddress && <div className="form-error">⚠ {errors.establishmentAddress}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Inspection Date <span className="required">*</span></label>
              <input className={`form-input ${errors.inspectionDate ? 'error' : ''}`} type="date" name="inspectionDate"
                value={form.inspectionDate} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
              {errors.inspectionDate && <div className="form-error">⚠ {errors.inspectionDate}</div>}
            </div>
          </div>
        </div>

        {/* Violation Information */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title"><span>⚠️</span> Violation Information</div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Violation Code <span className="required">*</span> <LiveIndicator field="violationCode" /></label>
                <input list="violation-codes" className={`form-input ${errors.violationCode ? 'error' : ''}`} name="violationCode"
                  value={form.violationCode} onChange={handleChange} placeholder="V01-CRITICAL"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
                <datalist id="violation-codes">
                  {VIOLATION_CODES.map(c => <option key={c} value={c} />)}
                </datalist>
                <div className="form-hint">Format: V[2 digits]-[CRITICAL|MAJOR|MINOR|ADVISORY|PASSED]</div>
                {errors.violationCode && <div className="form-error">⚠ {errors.violationCode}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Urgency Level <span className="required">*</span></label>
                <select className="form-select" name="urgencyLevel" value={form.urgencyLevel} onChange={handleChange}>
                  {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Violation Description <span className="required">*</span></label>
              <textarea className={`form-textarea ${errors.violationDescription ? 'error' : ''}`} name="violationDescription"
                value={form.violationDescription} onChange={handleChange}
                placeholder="Describe the violation in detail..." rows={3} />
              {errors.violationDescription && <div className="form-error">⚠ {errors.violationDescription}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Additional Observations</label>
              <textarea className="form-textarea" name="observations" value={form.observations} onChange={handleChange}
                placeholder="Any additional notes or observations..." rows={2} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="submit-report-btn">
          {loading ? <><Loader size={16} /> Processing & Submitting...</> : '🚀 Submit Inspection Report'}
        </button>
      </form>

      {/* Result Panel */}
      {result && !result.error && (
        <div className="card fade-in" style={{ marginTop: 24, border: '2px solid #16a34a' }}>
          <div className="card-header" style={{ background: '#f0fdf4' }}>
            <div className="card-title" style={{ color: '#15803d' }}><CheckCircle size={18} /> Report Submitted Successfully</div>
            <span className="code-text" style={{ fontSize: 14 }}>{result.report?.reportId}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
              <div className="detail-item"><label>Report ID</label><p className="code-text" style={{ fontSize: 14 }}>{result.report?.reportId}</p></div>
              <div className="detail-item"><label>Category</label><p><CategoryBadge category={result.report?.category} /></p></div>
              <div className="detail-item"><label>Priority</label><p><PriorityBadge priority={result.report?.priority} label={result.report?.priorityLabel} /></p></div>
              <div className="detail-item"><label>Zone</label><p>{result.report?.zone || 'Determining...'}</p></div>
              <div className="detail-item"><label>Assigned Handler</label><p>{result.report?.assignedHandlerName || (result.report?.inWaitingQueue ? '⏳ Waiting Queue' : result.report?.inCorrectionQueue ? '🔄 Correction Queue' : 'Pending')}</p></div>
              <div className="detail-item"><label>Status</label><p>{result.report?.currentStatus}</p></div>
            </div>

            {/* DFA Validation Result */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#475569' }}>🤖 DFA Validation</h4>
                <div className={`validation-box ${!result.validation?.inspectorId?.dfa?.valid || !result.validation?.violationCode?.dfa?.valid ? 'invalid' : ''}`}>
                  <div className="validation-row">
                    <div className={`validation-dot ${result.validation?.inspectorId?.dfa?.valid ? 'pass' : 'fail'}`}></div>
                    <span>Inspector ID: {result.validation?.inspectorId?.dfa?.valid ? '✅ Accepted' : '❌ Rejected'}</span>
                  </div>
                  <div className="validation-row">
                    <div className={`validation-dot ${result.validation?.violationCode?.dfa?.valid ? 'pass' : 'fail'}`}></div>
                    <span>Violation Code: {result.validation?.violationCode?.dfa?.valid ? '✅ Accepted' : '❌ Rejected'}</span>
                  </div>
                  <div className="validation-row">
                    <div className={`validation-dot ${result.validation?.dfaRegexAgreement ? 'pass' : 'fail'}`}></div>
                    <span>DFA ↔ Regex Agreement: {result.validation?.dfaRegexAgreement ? '✅ Agree' : '⚠️ Disagree'}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Final State: {result.report?.dfaValidationResult?.inspectorIdState}</p>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#475569' }}>🔤 Regex Validation</h4>
                <div className={`validation-box ${!result.validation?.inspectorId?.regex?.valid || !result.validation?.violationCode?.regex?.valid ? 'invalid' : ''}`}>
                  <div className="validation-row">
                    <div className={`validation-dot ${result.validation?.inspectorId?.regex?.valid ? 'pass' : 'fail'}`}></div>
                    <span>Inspector ID: {result.validation?.inspectorId?.regex?.valid ? '✅ Matched' : '❌ No match'}</span>
                  </div>
                  <div className="validation-row">
                    <div className={`validation-dot ${result.validation?.violationCode?.regex?.valid ? 'pass' : 'fail'}`}></div>
                    <span>Violation Code: {result.validation?.violationCode?.regex?.valid ? '✅ Matched' : '❌ No match'}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Pattern: {result.validation?.inspectorId?.regex?.pattern}</p>
                </div>
              </div>
            </div>

            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <Info size={14} />
              <span><strong>Dispatch:</strong> {result.dispatch?.decisionReason || 'Report dispatched to routing system'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Result */}
      {result?.error && (
        <div className="card fade-in" style={{ marginTop: 24, border: '2px solid #dc2626' }}>
          <div className="card-header" style={{ background: '#fef2f2' }}>
            <div className="card-title" style={{ color: '#dc2626' }}><XCircle size={18} /> Validation Failed</div>
          </div>
          <div className="card-body">
            <div className="error-box" style={{ marginBottom: 16 }}>{result.message}</div>
            {result.validationResult && (
              <div>
                <div className="validation-row"><div className={`validation-dot ${result.validationResult.inspectorId?.dfa?.valid ? 'pass' : 'fail'}`}></div><span>Inspector ID DFA: {result.validationResult.inspectorId?.dfa?.details}</span></div>
                <div className="validation-row"><div className={`validation-dot ${result.validationResult.violationCode?.dfa?.valid ? 'pass' : 'fail'}`}></div><span>Violation Code DFA: {result.validationResult.violationCode?.dfa?.details}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSubmission;
