import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI, analyticsAPI } from '../services/api';
import { CategoryBadge, StatusBadge, AssignmentBadge } from '../components/Badges';
import { useToast } from '../context/ToastContext';
import { Search, Filter, RefreshCw, Eye, FileText } from 'lucide-react';

const CATEGORIES = ['', 'Critical', 'Major', 'Minor', 'Advisory', 'Passed'];
const STATUSES   = ['', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
const ZONES      = ['', 'Zone-1', 'Zone-2', 'Zone-3', 'Zone-4', 'Zone-5', 'Zone-6'];

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-card-icon" style={{ background: `${color}18` }}>{icon}</div>
    <div className="stat-card-value" style={{ color }}>{value}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

const UserDashboard = () => {
  const { addToast } = useToast();
  const [reports, setReports]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);

  const [filters, setFilters] = useState({ search: '', category: '', status: '', zone: '', pinCode: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const [rRes, sRes] = await Promise.all([reportsAPI.getAll(params), analyticsAPI.getSummary()]);
      setReports(rRes.data.reports);
      setTotal(rRes.data.total);
      setPages(rRes.data.pages);
      setSummary(sRes.data.summary);
    } catch (err) {
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const ReportDetailModal = ({ report, onClose }) => {
    if (!report) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title">📋 Report Details — <span className="code-text">{report.reportId}</span></div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <CategoryBadge category={report.category} />
              <StatusBadge status={report.currentStatus} />
              {report.assignmentType && <AssignmentBadge type={report.assignmentType} />}
            </div>
            <div className="detail-grid">
              <div className="detail-item"><label>Establishment</label><p>{report.establishmentName}</p></div>
              <div className="detail-item"><label>PIN Code</label><p className="code-text">{report.pinCode}</p></div>
              <div className="detail-item"><label>Zone</label><p>{report.zone || 'Unknown'}</p></div>
              <div className="detail-item"><label>Inspector</label><p>{report.inspectorName} ({report.inspectorId})</p></div>
              <div className="detail-item"><label>Violation Code</label><p className="code-text">{report.violationCode}</p></div>
              <div className="detail-item"><label>Priority</label><p className={`priority-p${report.priority}`}>{report.priorityLabel || `P${report.priority}`}</p></div>
              <div className="detail-item"><label>Assigned Handler</label><p>{report.assignedHandlerName || 'Unassigned'}</p></div>
              <div className="detail-item"><label>Submitted</label><p>{new Date(report.createdAt).toLocaleString()}</p></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Description</label>
              <p style={{ marginTop: 6, fontSize: 14 }}>{report.violationDescription}</p>
            </div>
            {report.observations && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Observations</label>
                <p style={{ marginTop: 6, fontSize: 14 }}>{report.observations}</p>
              </div>
            )}
            {report.resolutionRemarks && (
              <div className="alert alert-success" style={{ marginTop: 12 }}>
                ✅ <strong>Resolution:</strong> {report.resolutionRemarks}
              </div>
            )}
            {/* Validation results */}
            {report.dfaValidationResult && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#475569' }}>Validation Results</h4>
                <div className="validation-box">
                  <div className="validation-row"><div className={`validation-dot ${report.dfaValidationResult.inspectorIdValid ? 'pass' : 'fail'}`}></div>
                    <span>DFA Inspector ID: {report.dfaValidationResult.inspectorIdValid ? 'Accepted' : 'Rejected'} (State: {report.dfaValidationResult.inspectorIdState})</span></div>
                  <div className="validation-row"><div className={`validation-dot ${report.dfaValidationResult.violationCodeValid ? 'pass' : 'fail'}`}></div>
                    <span>DFA Violation Code: {report.dfaValidationResult.violationCodeValid ? 'Accepted' : 'Rejected'}</span></div>
                  <div className="validation-row"><div className={`validation-dot ${report.dfaRegexAgreement ? 'pass' : 'fail'}`}></div>
                    <span>DFA ↔ Regex: {report.dfaRegexAgreement ? '✅ Agree' : '⚠️ Disagree'}</span></div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>📊 User Dashboard</h2>
          <p>View and track all submitted inspection reports</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stat-cards-grid">
          <StatCard icon="📁" label="Total Reports" value={summary.total} color="#1d4ed8" />
          <StatCard icon="⏳" label="Pending" value={summary.pending} color="#64748b" />
          <StatCard icon="📌" label="Assigned" value={summary.assigned} color="#2563eb" />
          <StatCard icon="🔄" label="In Progress" value={summary.inProgress} color="#d97706" />
          <StatCard icon="✅" label="Resolved" value={summary.resolved} color="#16a34a" />
          <StatCard icon="🚨" label="Critical" value={summary.categories?.critical} color="#dc2626" />
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input placeholder="Search by Report ID or establishment name..."
            value={filters.search}
            onChange={e => handleFilter('search', e.target.value)} />
        </div>
        <select className="filter-select" value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filters.zone} onChange={e => handleFilter('zone', e.target.value)}>
          <option value="">All Zones</option>
          {ZONES.filter(Boolean).map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <input className="filter-select" placeholder="PIN code" value={filters.pinCode}
          onChange={e => handleFilter('pinCode', e.target.value)} style={{ minWidth: 90 }} />
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><FileText size={16} /> Reports ({total})</div>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div><p>Loading reports...</p></div>
        ) : reports.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: 48 }}>📭</div><h3>No Reports Found</h3><p>No reports match your current filters</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>Establishment</th><th>Category</th>
                <th>PIN / Zone</th><th>Status</th><th>Handler</th><th>Submitted</th><th>Action</th>
              </tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td><span className="code-text">{r.reportId}</span></td>
                    <td>{r.establishmentName}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td><span className="code-text">{r.pinCode}</span><br/><small style={{ color: '#64748b' }}>{r.zone || 'Unknown'}</small></td>
                    <td><StatusBadge status={r.currentStatus} /></td>
                    <td style={{ fontSize: 12 }}>{r.assignedHandlerName || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}><Eye size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
              <button key={i+1} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next ›</button>
          </div>
        )}
      </div>

      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default UserDashboard;
