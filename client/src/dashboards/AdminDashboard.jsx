import React, { useState, useEffect } from 'react';
import { analyticsAPI, reportsAPI, handlersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, StatusBadge, AssignmentBadge } from '../components/Badges';
import { RefreshCw, LayoutDashboard, AlertTriangle, Eye } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-card-icon" style={{ background: `${color}18` }}>{icon}</div>
    <div className="stat-card-value" style={{ color }}>{value ?? 0}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes, hRes] = await Promise.all([
        analyticsAPI.getSummary(),
        reportsAPI.getAll({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        handlersAPI.getAll()
      ]);
      setSummary(sRes.data.summary);
      setRecentReports(rRes.data.reports);
      setHandlers(hRes.data.handlers);
    } catch (err) {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const ReportModal = ({ report, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div className="modal-title">Report: <span className="code-text">{report.reportId}</span></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.currentStatus} />
            {report.assignmentType && <AssignmentBadge type={report.assignmentType} />}
            {report.isEscalated && <span className="badge badge-escalated">🚨 ESCALATED</span>}
          </div>
          <div className="detail-grid">
            <div className="detail-item"><label>Establishment</label><p>{report.establishmentName}</p></div>
            <div className="detail-item"><label>PIN Code / Zone</label><p><span className="code-text">{report.pinCode}</span> — {report.zone}</p></div>
            <div className="detail-item"><label>Inspector</label><p>{report.inspectorName} ({report.inspectorId})</p></div>
            <div className="detail-item"><label>Violation Code</label><p className="code-text">{report.violationCode}</p></div>
            <div className="detail-item"><label>Priority</label><p className={`priority-p${report.priority}`}>{report.priorityLabel}</p></div>
            <div className="detail-item"><label>Handler</label><p>{report.assignedHandlerName || 'Unassigned'}</p></div>
            <div className="detail-item"><label>DFA Valid</label><p>{report.dfaValidationResult?.inspectorIdValid ? '✅ Yes' : '❌ No'}</p></div>
            <div className="detail-item"><label>Submitted</label><p>{new Date(report.createdAt).toLocaleString()}</p></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Description</label>
            <p style={{ marginTop: 6, fontSize: 14 }}>{report.violationDescription}</p>
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );

  if (loading) return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div><p>Loading...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>🏛️ Admin Dashboard</h2>
          <p>District Officer — System Overview</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <>
          <div className="stat-cards-grid">
            <StatCard icon="📁" label="Total Reports" value={summary.total} color="#1d4ed8" />
            <StatCard icon="⏳" label="Pending" value={summary.pending} color="#64748b" />
            <StatCard icon="📌" label="Assigned" value={summary.assigned} color="#2563eb" />
            <StatCard icon="🔄" label="In Progress" value={summary.inProgress} color="#d97706" />
            <StatCard icon="✅" label="Resolved" value={summary.resolved} color="#16a34a" />
          </div>
          <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
            <StatCard icon="🚨" label="Critical" value={summary.categories?.critical} color="#dc2626" />
            <StatCard icon="🔶" label="Major" value={summary.categories?.major} color="#ea580c" />
            <StatCard icon="🟡" label="Minor" value={summary.categories?.minor} color="#ca8a04" />
            <StatCard icon="🔵" label="Advisory" value={summary.categories?.advisory} color="#2563eb" />
            <StatCard icon="🟢" label="Passed" value={summary.categories?.passed} color="#16a34a" />
          </div>

          {/* Queue alerts */}
          {(summary.queues?.waiting > 0 || summary.queues?.escalated > 0 || summary.queues?.correction > 0) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {summary.queues?.escalated > 0 && (
                <div className="alert alert-error">
                  <AlertTriangle size={16} /> <strong>{summary.queues.escalated}</strong> CRITICAL reports escalated
                </div>
              )}
              {summary.queues?.waiting > 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} /> <strong>{summary.queues.waiting}</strong> reports in waiting queue
                </div>
              )}
              {summary.queues?.correction > 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} /> <strong>{summary.queues.correction}</strong> reports in correction queue (unknown zone)
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Handler Workload */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">👤 Handler Workload</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12, padding: 20 }}>
          {handlers.map(h => (
            <div key={h._id} className="zone-card">
              <div className="zone-header">
                <div>
                  <div className="zone-name">{h.fullName}</div>
                  <div className="zone-pin">{h.handlerId} • {h.zone}</div>
                </div>
                <span className={`badge ${h.isAvailable ? 'badge-passed' : 'badge-critical'}`} style={{ fontSize: 10 }}>
                  {h.isAvailable ? '🟢 Active' : '🔴 Off'}
                </span>
              </div>
              <div className="officer-row">
                <span className="officer-label">Load</span>
                <span className="officer-name">{h.currentOpenCases}/{h.maxCapacity} cases</span>
              </div>
              <div className="capacity-bar">
                <div className="capacity-bar-track">
                  <div className="capacity-bar-fill" style={{
                    width: `${Math.min(100, (h.currentOpenCases / h.maxCapacity) * 100)}%`,
                    background: h.currentOpenCases >= h.maxCapacity ? '#dc2626' : h.currentOpenCases >= h.maxCapacity * 0.7 ? '#d97706' : '#16a34a'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Recent Reports</div>
          <a href="/reports" className="btn btn-secondary btn-sm">View All</a>
        </div>
        {recentReports.length === 0 ? (
          <div className="empty-state"><p>No reports yet</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>Establishment</th><th>Category</th>
                <th>Zone</th><th>Status</th><th>Handler</th><th>Submitted</th><th>Action</th>
              </tr></thead>
              <tbody>
                {recentReports.map(r => (
                  <tr key={r._id}>
                    <td><span className="code-text" style={{ fontSize: 11 }}>{r.reportId}</span></td>
                    <td>{r.establishmentName}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td>{r.zone || 'Unknown'}</td>
                    <td><StatusBadge status={r.currentStatus} /></td>
                    <td style={{ fontSize: 12 }}>{r.assignedHandlerName || <span style={{color:'#94a3b8'}}>Unassigned</span>}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}><Eye size={13}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <ReportModal report={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AdminDashboard;
