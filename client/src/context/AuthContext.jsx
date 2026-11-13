import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until hydration done

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('fsp_token');
    const savedUser = localStorage.getItem('fsp_user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        // corrupted — clear it
        localStorage.removeItem('fsp_token');
        localStorage.removeItem('fsp_user');
      }
    }
    // Always mark hydration done
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    if (data.success) {
      localStorage.setItem('fsp_token', data.token);
      localStorage.setItem('fsp_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('fsp_token');
    localStorage.removeItem('fsp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
