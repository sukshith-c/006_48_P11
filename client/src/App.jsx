import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Dashboards
import UserDashboard from './dashboards/UserDashboard';
import HandlerDashboard from './dashboards/HandlerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import RoutingDashboard from './dashboards/RoutingDashboard';
import AnalyticsDashboard from './dashboards/AnalyticsDashboard';
import TestingDashboard from './dashboards/TestingDashboard';
import ReportSubmission from './dashboards/ReportSubmission';
import AllReports from './dashboards/AllReports';

import './index.css';

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <div className="page-content fade-in">
        {children}
      </div>
    </div>
  </div>
);

// Spinner shown while auth is hydrating
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f1f5f9', flexDirection: 'column', gap: 16
  }}>
    <div style={{
      width: 48, height: 48, border: '4px solid #e2e8f0',
      borderTop: '4px solid #2563eb', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: '#64748b', fontSize: 15 }}>Food Safety Portal loading...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Root "/" redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)                       return <Navigate to="/login"     replace />;
  if (user.role === 'admin')       return <Navigate to="/admin"     replace />;
  if (user.role === 'inspector')   return <Navigate to="/dashboard" replace />;
  if (user.role === 'handler')     return <Navigate to="/handler"   replace />;
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public — Login page handles its own redirect if already authed */}
            <Route path="/login" element={<Login />} />

            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Inspector routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['inspector', 'admin']}>
                <AppLayout><UserDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/submit" element={
              <ProtectedRoute allowedRoles={['inspector', 'admin']}>
                <AppLayout><ReportSubmission /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Handler routes */}
            <Route path="/handler" element={
              <ProtectedRoute allowedRoles={['handler', 'admin']}>
                <AppLayout><HandlerDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/routing" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><RoutingDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/testing" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><TestingDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><AllReports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/handlers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><AllReports /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Analytics - all roles */}
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'inspector', 'handler']}>
                <AppLayout><AnalyticsDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
