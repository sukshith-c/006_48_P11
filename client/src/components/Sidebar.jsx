import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Shield, BarChart3, TestTube2,
  MapPin, LogOut, ChevronRight, AlertTriangle, User, Settings
} from 'lucide-react';

const NAV_ADMIN = [
  { to: '/admin',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/routing',   icon: MapPin,          label: 'Routing Management' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/handlers',  icon: User,            label: 'Handlers' },
  { to: '/reports',   icon: FileText,        label: 'All Reports' },
  { to: '/testing',   icon: TestTube2,       label: 'Testing Dashboard' },
];

const NAV_INSPECTOR = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit',    icon: FileText,        label: 'Submit Report' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
];

const NAV_HANDLER = [
  { to: '/handler',   icon: Shield,          label: 'My Cases' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'admin'
    ? NAV_ADMIN
    : user?.role === 'inspector'
    ? NAV_INSPECTOR
    : NAV_HANDLER;

  const roleLabel = user?.role === 'admin'
    ? 'District Officer'
    : user?.role === 'inspector'
    ? 'Food Inspector'
    : 'Regulatory Handler';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛡️</div>
        <div className="sidebar-logo-text">
          <h1>FOOD SAFETY</h1>
          <p>INSPECTION PORTAL</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} className="sidebar-link-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="sidebar-user-info">
            <p>{user?.fullName || 'User'}</p>
            <span>{roleLabel}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
