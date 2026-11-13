import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Eye, EyeOff, Loader } from 'lucide-react';

const DEMO_CREDS = [
  { label: 'Admin / District Officer', email: 'admin@foodsafety.gov.in', password: 'Admin@123', role: 'admin' },
  { label: 'Inspector / Report Submitter', email: 'inspector@foodsafety.gov.in', password: 'Inspector@123', role: 'inspector' },
  { label: 'Handler / Regulatory Officer', email: 'h1p@foodsafety.gov.in', password: 'Handler@123', role: 'handler' },
];

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'inspector') navigate('/dashboard', { replace: true });
      else navigate('/handler', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(form.email, form.password);
      addToast(`Welcome, ${loggedInUser.fullName}!`, 'success');
      if (loggedInUser.role === 'admin') navigate('/admin', { replace: true });
      else if (loggedInUser.role === 'inspector') navigate('/dashboard', { replace: true });
      else navigate('/handler', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillCreds = (cred) => {
    setForm({ email: cred.email, password: cred.password });
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-logo">
          <div className="login-logo-icon">🛡️</div>
          <div>
            <h1>Food Safety<br/>Inspection Portal</h1>
          </div>
        </div>
        <p className="subtitle">Government of India — Ministry of Health & Family Welfare<br/>Digital Food Safety Management System</p>
        <div className="login-features">
          {[
            { icon: '🔍', text: 'DFA & Regex-based inspection report validation' },
            { icon: '📍', text: '6-Zone smart dispatch & routing algorithm' },
            { icon: '📊', text: 'Real-time analytics & workload monitoring' },
            { icon: '🔒', text: 'Role-based access: Admin · Inspector · Handler' },
          ].map((f, i) => (
            <div className="login-feature" key={i}>
              <div className="login-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>🏛️ Sign In</h2>
          <p className="sub">Enter your credentials to access the portal</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username <span className="required">*</span></label>
              <input
                className="form-input"
                name="email"
                type="text"
                placeholder="admin@foodsafety.gov.in"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="login-submit-btn">
              {loading ? <><Loader size={16} className="spin" /> Signing in...</> : '🔐 Sign In to Portal'}
            </button>
          </form>

          <div className="login-divider">Demo Accounts</div>

          <div className="demo-creds">
            <p>CLICK TO FILL CREDENTIALS</p>
            {DEMO_CREDS.map((c) => (
              <div key={c.role} className="demo-cred-row" onClick={() => fillCreds(c)}>
                <strong>{c.label}</strong>
                <span>{c.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
