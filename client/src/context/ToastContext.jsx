import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

const TOAST_STYLES = {
  success: { background: '#16a34a', border: '1px solid #15803d' },
  error:   { background: '#dc2626', border: '1px solid #b91c1c' },
  warning: { background: '#d97706', border: '1px solid #b45309' },
  info:    { background: '#2563eb', border: '1px solid #1d4ed8' }
};

const Toast = ({ toast, onRemove }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div style={{
      ...style, color: '#fff', padding: '12px 16px', borderRadius: 8,
      display: 'flex', alignItems: 'center', gap: 8, minWidth: 280, maxWidth: 400,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span style={{ flex: 1, fontSize: 14 }}>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} style={{
        background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: 0.7
      }}>✕</button>
    </div>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
