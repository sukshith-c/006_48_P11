import React, { useState, useEffect } from 'react';
import { testsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Play, CheckCircle, XCircle, RefreshCw, TestTube2, Loader } from 'lucide-react';

const TestingDashboard = () => {
  const { addToast } = useToast();
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data } = await testsAPI.getResults();
      setResults(data.results || []);
      setSummary(data.summary);
    } catch (err) {
      addToast('Failed to load test results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setRunning(true);
    addToast('Running automated tests...', 'info');
    try {
      const { data } = await testsAPI.getResults();
      setResults(data.results || []);
      setSummary(data.summary);
      const { passed, failed, total } = data.summary;
      addToast(`Tests complete: ${passed}/${total} passed, ${failed} failed`, failed > 0 ? 'warning' : 'success');
    } catch (err) {
      addToast('Test run failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { fetchResults(); }, []);

  const passRate = summary ? Math.round((summary.passed / summary.total) * 100) : 0;

  const GROUP_COLORS = {
    'TC-00': '#1d4ed8',
    'TC-01': '#7c3aed',
    'TC-02': '#ea580c',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>🧪 Testing Dashboard</h2>
          <p>Automated test suite — 22+ test cases covering DFA, classification, routing, and edge cases</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchResults} disabled={loading}>
            <RefreshCw size={14} /> Reload
          </button>
          <button className="btn btn-primary" onClick={runTests} disabled={running || loading} id="run-tests-btn">
            {running ? <><Loader size={14} /> Running Tests...</> : <><Play size={14} /> Run All Tests</>}
          </button>
        </div>
      </div>

      {summary && (
        <div className="stat-cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#eff6ff' }}>🧰</div>
            <div className="stat-card-value" style={{ color: '#1d4ed8' }}>{summary.total}</div>
            <div className="stat-card-label">Total Tests</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>✅</div>
            <div className="stat-card-value" style={{ color: '#16a34a' }}>{summary.passed}</div>
            <div className="stat-card-label">Passed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: '#fef2f2' }}>❌</div>
            <div className="stat-card-value" style={{ color: '#dc2626' }}>{summary.failed}</div>
            <div className="stat-card-label">Failed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: passRate === 100 ? '#f0fdf4' : '#fff7ed' }}>🎯</div>
            <div className="stat-card-value" style={{ color: passRate === 100 ? '#16a34a' : passRate >= 80 ? '#d97706' : '#dc2626' }}>
              {passRate}%
            </div>
            <div className="stat-card-label">Pass Rate</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              <span>Test Pass Rate</span>
              <span style={{ color: passRate === 100 ? '#16a34a' : '#d97706' }}>{summary.passed}/{summary.total} Tests Passing</span>
            </div>
            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                width: `${passRate}%`, height: '100%', borderRadius: 5,
                background: passRate === 100 ? '#16a34a' : passRate >= 80 ? '#d97706' : '#dc2626',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#64748b' }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ {summary.passed} Passed</span>
              {summary.failed > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>❌ {summary.failed} Failed</span>}
            </div>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><TestTube2 size={16} /> Test Results</div>
          {loading && <div className="spinner" style={{ width: 20, height: 20 }}></div>}
        </div>
        {loading && results.length === 0 ? (
          <div className="loading-spinner"><div className="spinner"></div><p>Loading test results...</p></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>🧪</div>
            <h3>No Test Results</h3>
            <p>Click "Run All Tests" to execute the test suite</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={runTests}><Play size={14} /> Run Tests</button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr 80px', gap: 12,
              padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <div>Test ID</div>
              <div>Description</div>
              <div>Expected</div>
              <div>Actual</div>
              <div>Status</div>
            </div>
            {results.map((t, i) => (
              <div key={t.id} className="test-row" style={{
                background: i % 2 === 0 ? '#ffffff' : '#fafafa',
                borderLeft: `3px solid ${t.status === 'PASS' ? '#16a34a' : '#dc2626'}`
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#475569' }}>{t.id}</div>
                <div style={{ fontSize: 12, color: '#334155' }}>{t.description}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{t.expected}</div>
                <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{t.actual}</div>
                <div>
                  {t.status === 'PASS'
                    ? <span className="test-status-pass"><CheckCircle size={14} /> PASS</span>
                    : <span className="test-status-fail"><XCircle size={14} /> FAIL</span>
                  }
                </div>
              </div>
            ))}
            {running && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                <Loader size={16} /> Running tests...
              </div>
            )}
          </>
        )}
      </div>

      {/* Test categories info */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><div className="card-title">📚 Test Coverage</div></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            {[
              { label: 'DFA Validation (TC-001 to TC-003)', count: 3, color: '#1d4ed8' },
              { label: 'Violation Code Validation (TC-004 to TC-006)', count: 3, color: '#7c3aed' },
              { label: 'DFA & Regex Agreement (TC-007 to TC-008)', count: 2, color: '#0891b2' },
              { label: '5-Category Classification (TC-009 to TC-013)', count: 5, color: '#16a34a' },
              { label: 'Classification Edge Cases (TC-014 to TC-015)', count: 2, color: '#d97706' },
              { label: 'Zone Routing (TC-016 to TC-019)', count: 4, color: '#ea580c' },
              { label: 'Regex Validation (TC-020 to TC-021)', count: 2, color: '#7c3aed' },
              { label: 'Priority Override (TC-022)', count: 1, color: '#dc2626' },
              { label: 'Bonus Edge Cases', count: 5, color: '#64748b' },
            ].map(g => (
              <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{g.count} test{g.count > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingDashboard;
