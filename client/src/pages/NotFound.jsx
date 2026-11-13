import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🚫</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>404 — Page Not Found</h1>
      <p style={{ color: '#64748b' }}>The page you're looking for doesn't exist.</p>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
};

export default NotFound;
