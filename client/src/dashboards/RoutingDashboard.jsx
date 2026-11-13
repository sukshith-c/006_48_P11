import React, { useState, useEffect } from 'react';
import { routingAPI, handlersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, StatusBadge, AssignmentBadge } from '../components/Badges';
import { RefreshCw, MapPin, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const RoutingDashboard = () => {
  const { addToast } = useToast();
  const [table, setTable] = useState([]);
  const [queue, setQueue] = useState({ waitingQueue: [], correctionQueue: [], escalated: [] });
  const [decisions, setDecisions] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchInput, setDispatchInput] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, qRes, dRes, hRes] = await Promise.all([
        routingAPI.getTable(),
        routingAPI.getQueue(),
        routingAPI.getDecisions({ limit: 20 }),
        handlersAPI.getAll()
      ]);
      setTable(tRes.data.table);
      setQueue(qRes.data);
      setDecisions(dRes.data.decisions);
      setHandlers(hRes.data.handlers);
    } catch (err) {
      addToast('Failed to load routing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDispatch = async () => {
    if (!dispatchInput.trim()) return;
    setDispatching(true);
    try {
      const { data } = await routingAPI.dispatch({ reportId: dispatchInput.trim() });
      addToast(`Dispatched: ${data.decision?.decisionReason || 'Success'}`, 'success');
      setDispatchInput('');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Dispatch failed', 'error');
    } finally {
      setDispatching(false);
    }
  };

  const handleUpdateAvailability = async (handlerId, val) => {
    try {
      await handlersAPI.updateAvailability(handlerId, { isAvailable: val });
      addToast('Availability updated', 'success');
      fetchAll();
    } catch {
      addToast('Failed', 'error');
    }
  };

  if (loading) return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div><p>Loading routing data...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>🗺️ Routing Management Dashboard</h2>
          <p>Administrator — 6-Zone dispatch management</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Manual Dispatch */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title"><MapPin size={16} /> Manual Dispatch</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" placeholder="Enter Report ID (e.g. FSP-20241113-XXXX)"
              value={dispatchInput} onChange={e => setDispatchInput(e.target.value)}
              style={{ flex: 1, fontFamily: 'monospace' }} />
            <button className="btn btn-primary" onClick={handleDispatch} disabled={dispatching}>
              {dispatching ? '🔄 Dispatching...' : '🚀 Dispatch'}
            </button>
          </div>
        </div>
      </div>

      {/* Routing Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📊 Routing Table — 6 Zones</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Zone</th><th>PIN Range</th><th>Primary Officer</th><th>Status</th>
              <th>Open Cases</th><th>Capacity</th><th>Deputy Officer</th><th>Deputy Status</th>
            </tr></thead>
            <tbody>
              {table.map(z => (
                <tr key={z.zoneId}>
                  <td><strong>{z.zoneName}</strong></td>
                  <td><span className="code-text">{z.pinCodeRange}</span></td>
                  <td>
                    <div>{z.primaryOfficer?.fullName || '-'}</div>
                    <small className="code-text" style={{ fontSize: 10 }}>{z.primaryOfficer?.handlerId}</small>
                  </td>
                  <td>
                    {z.primaryOfficer ? (
                      <span className={`badge ${z.primaryOfficer.isAvailable ? 'badge-passed' : 'badge-critical'}`}>
                        {z.primaryOfficer.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: z.primaryOfficer?.currentOpenCases >= 10 ? '#dc2626' : '#16a34a' }}>
                        {z.primaryOfficer?.currentOpenCases || 0}
                      </span>
                      <div className="capacity-bar" style={{ width: 60 }}>
                        <div className="capacity-bar-track">
                          <div className="capacity-bar-fill" style={{
                            width: `${Math.min(100, ((z.primaryOfficer?.currentOpenCases || 0) / (z.primaryOfficer?.maxCapacity || 10)) * 100)}%`,
                            background: (z.primaryOfficer?.currentOpenCases || 0) >= (z.primaryOfficer?.maxCapacity || 10) ? '#dc2626' : '#16a34a'
                          }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{z.primaryOfficer?.maxCapacity || 10}</td>
                  <td>
                    <div>{z.deputyOfficer?.fullName || '-'}</div>
                    <small className="code-text" style={{ fontSize: 10 }}>{z.deputyOfficer?.handlerId}</small>
                  </td>
                  <td>
                    {z.deputyOfficer ? (
                      <span className={`badge ${z.deputyOfficer.isAvailable ? 'badge-passed' : 'badge-critical'}`}>
                        {z.deputyOfficer.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title"><Clock size={16} /> Waiting Queue ({queue.waitingQueue?.length})</div></div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {queue.waitingQueue?.length === 0 ? <div className="empty-state" style={{ padding: 20 }}><p>Queue empty</p></div> :
              queue.waitingQueue?.map(r => (
                <div key={r._id} style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="code-text" style={{ fontSize: 11 }}>{r.reportId}</span>
                    <CategoryBadge category={r.category} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.establishmentName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Zone: {r.zone} | PIN: {r.pinCode}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><AlertTriangle size={16} /> Correction Queue ({queue.correctionQueue?.length})</div></div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {queue.correctionQueue?.length === 0 ? <div className="empty-state" style={{ padding: 20 }}><p>Queue empty</p></div> :
              queue.correctionQueue?.map(r => (
                <div key={r._id} style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <span className="code-text" style={{ fontSize: 11 }}>{r.reportId}</span>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{r.establishmentName}</div>
                  <div style={{ fontSize: 11, color: '#dc2626' }}>Unknown PIN: {r.pinCode}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><AlertTriangle size={16} style={{color:'#dc2626'}} /> Escalated ({queue.escalated?.length})</div></div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {queue.escalated?.length === 0 ? <div className="empty-state" style={{ padding: 20 }}><p>No escalations</p></div> :
              queue.escalated?.map(r => (
                <div key={r._id} style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <span className="code-text" style={{ fontSize: 11 }}>{r.reportId}</span>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{r.establishmentName}</div>
                  <CategoryBadge category={r.category} />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Handler Availability Panel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">👤 Handler Availability Management</div></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
            {handlers.map(h => (
              <div key={h._id} className="zone-card">
                <div className="zone-header">
                  <div>
                    <div className="zone-name">{h.fullName}</div>
                    <div className="zone-pin">{h.handlerId} • {h.zone}</div>
                  </div>
                  <span className={`badge ${h.role === 'primary' ? 'badge-primary-assign' : 'badge-deputy-assign'}`}>{h.role}</span>
                </div>
                <div className="officer-row">
                  <span className="officer-label">Open Cases</span>
                  <span className="officer-name">{h.currentOpenCases} / {h.maxCapacity}</span>
                </div>
                <div className="capacity-bar">
                  <div className="capacity-bar-track">
                    <div className="capacity-bar-fill" style={{
                      width: `${Math.min(100, (h.currentOpenCases / h.maxCapacity) * 100)}%`,
                      background: h.currentOpenCases >= h.maxCapacity ? '#dc2626' : h.currentOpenCases >= h.maxCapacity * 0.7 ? '#d97706' : '#16a34a'
                    }} />
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <button className={`btn btn-sm ${h.isAvailable ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleUpdateAvailability(h._id, true)}>
                    🟢 Available
                  </button>
                  <button className={`btn btn-sm ${!h.isAvailable ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => handleUpdateAvailability(h._id, false)}>
                    🔴 Unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Routing Decision History */}
      <div className="card">
        <div className="card-header"><div className="card-title">📜 Routing Decision History (last 20)</div></div>
        {decisions.length === 0 ? <div className="empty-state"><p>No decisions yet</p></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Report ID</th><th>PIN Code</th><th>Zone</th><th>Category</th>
                <th>Assignment</th><th>Handler</th><th>Decision Reason</th><th>Time</th>
              </tr></thead>
              <tbody>
                {decisions.map(d => (
                  <tr key={d._id}>
                    <td><span className="code-text" style={{ fontSize: 11 }}>{d.reportIdStr}</span></td>
                    <td><span className="code-text">{d.pinCode}</span></td>
                    <td>{d.zone}</td>
                    <td>{d.category ? <CategoryBadge category={d.category} /> : '-'}</td>
                    <td><AssignmentBadge type={d.assignmentType} /></td>
                    <td style={{ fontSize: 12 }}>{d.assignedHandlerName || '-'}</td>
                    <td style={{ fontSize: 11, color: '#64748b', maxWidth: 200 }}>{d.decisionReason}</td>
                    <td style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(d.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutingDashboard;
