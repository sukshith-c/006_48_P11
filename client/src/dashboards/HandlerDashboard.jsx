import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, handlersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, StatusBadge } from '../components/Badges';
import { RefreshCw, CheckCircle, Loader, User, AlertCircle } from 'lucide-react';

const HandlerDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [handler, setHandler] = useState(user?.handlerInfo || null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [selected, setSelected] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [availability, setAvailability] = useState(handler?.isAvailable ?? true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes] = await Promise.all([
        reportsAPI.getAll({ limit: 50 })
      ]);
      setReports(rRes.data.reports || []);
    } catch (err) {
      addToast('Failed to load cases', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (report, newStatus) => {
    setUpdating(p => ({ ...p, [report._id]: true }));
    try {
      await reportsAPI.updateStatus(report._id, { status: newStatus, resolutionRemarks: remarkInput || undefined });
      addToast(`Status updated to ${newStatus}`, 'success');
      setSelected(null);
      setRemarkInput('');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setUpdating(p => ({ ...p, [report._id]: false }));
    }
  };

  const toggleAvailability = async () => {
    if (!handler) { addToast('Handler profile not found', 'error'); return; }
    try {
      const newVal = !availability;
      await handlersAPI.updateAvailability(handler._id, { isAvailable: newVal });
      setAvailability(newVal);
      addToast(`Availability set to ${newVal ? 'Available' : 'Unavailable'}`, 'success');
    } catch (err) {
      addToast('Failed to update availability', 'error');
    }
  };

  const open = reports.filter(r => ['Assigned', 'In Progress'].includes(r.currentStatus));
  const resolved = reports.filter(r => r.currentStatus === 'Resolved');

  const StatusModal = ({ report, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">Update Status &mdash; {report.reportId}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div className="detail-item" style={{ marginBottom: 10 }}>
              <label>Establishment</label><p>{report.establishmentName}</p>
            </div>
            <div className="detail-item" style={{ marginBottom: 10 }}>
              <label>Current Status</label><p><StatusBadge status={report.currentStatus} /></p>
            </div>
            <div className="detail-item" style={{ marginBottom: 10 }}>
              <label>Category</label><p><CategoryBadge category={report.category} /></p>
            </div>
          </div>
          {report.currentStatus === 'In Progress' && (
            <div className="form-group">
              <label className="form-label">Resolution Remarks</label>
              <textarea className="form-textarea" value={remarkInput}
                onChange={e => setRemarkInput(e.target.value)}
                placeholder="Describe how the violation was resolved..." rows={3} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {report.currentStatus === 'Assigned' && (
            <button className="btn btn-warning" onClick={() => updateStatus(report, 'In Progress')}
              disabled={updating[report._id]}>
              {updating[report._id] ? <Loader size={14} /> : null} 🔄 Mark In Progress
            </button>
          )}
          {report.currentStatus === 'In Progress' && (
            <button className="btn btn-success" onClick={() => updateStatus(report, 'Resolved')}
              disabled={updating[report._id]}>
              {updating[report._id] ? <Loader size={14} /> : null} ✅ Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>🛡️ Handler Dashboard</h2>
          <p>Manage your assigned inspection reports</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${availability ? 'btn-success' : 'btn-secondary'}`} onClick={toggleAvailability}>
            {availability ? '🟢 Available' : '🔴 Unavailable'}
          </button>
          <button className="btn btn-secondary" onClick={fetchData}><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>📁</div>
          <div className="stat-card-value" style={{ color: '#1d4ed8' }}>{reports.length}</div>
          <div className="stat-card-label">Total Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#fff7ed' }}>🔄</div>
          <div className="stat-card-value" style={{ color: '#d97706' }}>{open.length}</div>
          <div className="stat-card-label">Open Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>✅</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>{resolved.length}</div>
          <div className="stat-card-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: availability ? '#f0fdf4' : '#fef2f2' }}>
            {availability ? '🟢' : '🔴'}
          </div>
          <div className="stat-card-value" style={{ color: availability ? '#16a34a' : '#dc2626', fontSize: 16 }}>
            {availability ? 'Available' : 'Unavailable'}
          </div>
          <div className="stat-card-label">My Status</div>
        </div>
      </div>

      {/* Open Cases */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title"><AlertCircle size={16} /> Open Cases ({open.length})</div>
        </div>
        {loading ? <div className="loading-spinner"><div className="spinner"></div></div> :
         open.length === 0 ? <div className="empty-state"><div style={{ fontSize: 48 }}>🎉</div><h3>No Open Cases</h3><p>All caught up!</p></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>Establishment</th><th>Category</th>
                <th>Zone</th><th>Priority</th><th>Submitted</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {open.map(r => (
                  <tr key={r._id}>
                    <td><span className="code-text">{r.reportId}</span></td>
                    <td>{r.establishmentName}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td>{r.zone}</td>
                    <td><span className={`priority-p${r.priority}`}>{r.priorityLabel || `P${r.priority}`}</span></td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><StatusBadge status={r.currentStatus} /></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(r)}>
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         )}
      </div>

      {/* Resolved Cases */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><CheckCircle size={16} /> Resolved Cases ({resolved.length})</div>
        </div>
        {resolved.length === 0 ? <div className="empty-state" style={{ padding: 32 }}><p>No resolved cases yet</p></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>Establishment</th><th>Category</th><th>Resolved At</th><th>Remarks</th>
              </tr></thead>
              <tbody>
                {resolved.map(r => (
                  <tr key={r._id}>
                    <td><span className="code-text">{r.reportId}</span></td>
                    <td>{r.establishmentName}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td style={{ fontSize: 12 }}>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '-'}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{r.resolutionRemarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <StatusModal report={selected} onClose={() => { setSelected(null); setRemarkInput(''); }} />}
    </div>
  );
};

export default HandlerDashboard;
