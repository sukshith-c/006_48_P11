import React, { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../services/api';
import { CategoryBadge, StatusBadge, AssignmentBadge } from '../components/Badges';
import { useToast } from '../context/ToastContext';
import { Search, RefreshCw, Eye, FileText } from 'lucide-react';

const CATEGORIES = ['', 'Critical', 'Major', 'Minor', 'Advisory', 'Passed'];
const STATUSES   = ['', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
const ZONES      = ['', 'Zone-1', 'Zone-2', 'Zone-3', 'Zone-4', 'Zone-5', 'Zone-6'];

const AllReports = () => {
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', zone: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await reportsAPI.getAll(params);
      setReports(data.reports);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

  const ReportModal = ({ report, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <div className="modal-title">Report: <span className="code-text">{report.reportId}</span></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.currentStatus} />
            {report.assignmentType && <AssignmentBadge type={report.assignmentType} />}
          </div>
          <div className="detail-grid">
            <div className="detail-item"><label>Establishment</label><p>{report.establishmentName}</p></div>
            <div className="detail-item"><label>PIN / Zone</label><p><span className="code-text">{report.pinCode}</span> — {report.zone}</p></div>
            <div className="detail-item"><label>Inspector</label><p>{report.inspectorName} ({report.inspectorId})</p></div>
            <div className="detail-item"><label>Violation Code</label><p className="code-text">{report.violationCode}</p></div>
            <div className="detail-item"><label>Priority</label><p className={`priority-p${report.priority}`}>{report.priorityLabel}</p></div>
            <div className="detail-item"><label>Handler</label><p>{report.assignedHandlerName || 'Unassigned'}</p></div>
            <div className="detail-item"><label>Inspection Date</label><p>{report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : '-'}</p></div>
            <div className="detail-item"><label>Submitted</label><p>{new Date(report.createdAt).toLocaleString()}</p></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Description</label>
            <p style={{ marginTop: 6, fontSize: 14 }}>{report.violationDescription}</p>
          </div>
          {report.resolutionRemarks && (
            <div className="alert alert-success" style={{ marginTop: 12 }}>✅ {report.resolutionRemarks}</div>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>📋 All Reports</h2><p>Admin view of all submitted reports ({total} total)</p></div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input placeholder="Search Report ID or establishment..." value={filters.search} onChange={e => handleFilter('search', e.target.value)} />
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
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title"><FileText size={16} /> Reports ({total})</div></div>
        {loading ? <div className="loading-spinner"><div className="spinner"></div></div> :
         reports.length === 0 ? <div className="empty-state"><div style={{fontSize:48}}>📭</div><h3>No Reports Found</h3></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>Establishment</th><th>Category</th><th>Zone</th>
                <th>Status</th><th>Assignment</th><th>Handler</th><th>Submitted</th><th></th>
              </tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td><span className="code-text" style={{fontSize:11}}>{r.reportId}</span></td>
                    <td>{r.establishmentName}</td>
                    <td><CategoryBadge category={r.category} /></td>
                    <td>{r.zone || 'Unknown'}</td>
                    <td><StatusBadge status={r.currentStatus} /></td>
                    <td>{r.assignmentType ? <AssignmentBadge type={r.assignmentType} /> : '-'}</td>
                    <td style={{fontSize:12}}>{r.assignedHandlerName || <span style={{color:'#94a3b8'}}>Unassigned</span>}</td>
                    <td style={{fontSize:11,color:'#64748b'}}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}><Eye size={13}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="pagination">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹ Prev</button>
            {Array.from({length:Math.min(pages,7)},(_,i)=>(
              <button key={i+1} className={page===i+1?'active':''} onClick={()=>setPage(i+1)}>{i+1}</button>
            ))}
            <button disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next ›</button>
          </div>
        )}
      </div>
      {selected && <ReportModal report={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
};

export default AllReports;
