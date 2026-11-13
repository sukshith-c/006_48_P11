import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show spinner while auth state is being determined
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f1f5f9', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 40, height: 40, border: '4px solid #e2e8f0',
          borderTop: '4px solid #2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading portal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin')     return <Navigate to="/admin"     replace />;
    if (user.role === 'inspector') return <Navigate to="/dashboard" replace />;
    if (user.role === 'handler')   return <Navigate to="/handler"   replace />;
  }

  return children;
};

export default ProtectedRoute;
