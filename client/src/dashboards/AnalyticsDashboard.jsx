import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { RefreshCw, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const COLORS = ['#dc2626','#ea580c','#ca8a04','#2563eb','#16a34a','#7c3aed','#0891b2'];

const ChartCard = ({ title, children }) => (
  <div className="card">
    <div className="card-header"><div className="card-title"><BarChart3 size={16} /> {title}</div></div>
    <div className="card-body" style={{ height: 320 }}>{children}</div>
  </div>
);

const AnalyticsDashboard = () => {
  const { addToast } = useToast();
  const [data, setData] = useState({ summary: null, categories: [], zones: [], statuses: [], handlers: null });
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, zRes, stRes, hRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getCategories(),
        analyticsAPI.getZones(),
        analyticsAPI.getStatus(),
        analyticsAPI.getHandlers()
      ]);
      setData({
        summary: sRes.data.summary,
        categories: cRes.data.data,
        zones: zRes.data.data,
        statuses: stRes.data.data,
        handlers: hRes.data
      });
    } catch (err) {
      addToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="loading-spinner" style={{ minHeight: '60vh' }}><div className="spinner"></div><p>Loading analytics...</p></div>;

  const { summary, categories, zones, statuses, handlers } = data;

  const resolvedUnresolved = summary ? [
    { name: 'Resolved', value: summary.resolved, color: '#16a34a' },
    { name: 'Unresolved', value: summary.total - summary.resolved, color: '#ea580c' }
  ] : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>📊 Analytics Dashboard</h2>
          <p>Live data visualization from MongoDB</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Summary row */}
      {summary && (
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'#eff6ff'}}>📁</div><div className="stat-card-value" style={{color:'#1d4ed8'}}>{summary.total}</div><div className="stat-card-label">Total Reports</div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'#fef2f2'}}>🚨</div><div className="stat-card-value" style={{color:'#dc2626'}}>{summary.categories?.critical}</div><div className="stat-card-label">Critical</div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'#f0fdf4'}}>✅</div><div className="stat-card-value" style={{color:'#16a34a'}}>{summary.resolved}</div><div className="stat-card-label">Resolved</div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'#fff7ed'}}>⏳</div><div className="stat-card-value" style={{color:'#d97706'}}>{summary.queues?.waiting}</div><div className="stat-card-label">In Queue</div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'#faf5ff'}}>🚨</div><div className="stat-card-value" style={{color:'#7c3aed'}}>{summary.queues?.escalated}</div><div className="stat-card-label">Escalated</div></div>
        </div>
      )}

      <div className="charts-grid">
        {/* Category Distribution Pie */}
        <ChartCard title="Category-wise Distribution">
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} cx="50%" cy="45%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {categories.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </ChartCard>

        {/* Zone Distribution Bar */}
        <ChartCard title="Zone-wise Report Distribution">
          {zones.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} margin={{top:10,right:20,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="value" name="Reports" radius={[4,4,0,0]}>
                  {zones.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </ChartCard>

        {/* Status Distribution Doughnut */}
        <ChartCard title="Status Distribution">
          {statuses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statuses} cx="50%" cy="45%" innerRadius={55} outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                  {statuses.map((entry,i) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </ChartCard>

        {/* Resolved vs Unresolved */}
        <ChartCard title="Resolved vs Unresolved">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={resolvedUnresolved} cx="50%" cy="45%" outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                {resolvedUnresolved.map((entry,i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Handler workload */}
        {handlers?.handlerWorkload?.length > 0 && (
          <ChartCard title="Handler Workload Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={handlers.handlerWorkload} layout="vertical" margin={{top:5,right:30,left:80,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{fontSize:11}} />
                <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={80} />
                <Tooltip />
                <Bar dataKey="openCases" name="Open Cases" fill="#2563eb" radius={[0,4,4,0]} />
                <Bar dataKey="maxCapacity" name="Max Capacity" fill="#e2e8f0" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Priority Distribution */}
        {handlers?.priorityDistribution?.length > 0 && (
          <ChartCard title="Priority-wise Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={handlers.priorityDistribution} margin={{top:10,right:20,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="value" name="Reports" radius={[4,4,0,0]}>
                  {(handlers.priorityDistribution||[]).map((_,i) => <Cell key={i} fill={['#dc2626','#ea580c','#ca8a04','#2563eb','#16a34a'][i] || COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
