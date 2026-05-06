import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import {
  LayoutDashboard, Wrench, Shield, Ship, Users, LogOut, Anchor, BarChart3, X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { isOpen, close } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={close} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ color: 'var(--teal-400)' }}><Anchor size={28} strokeWidth={2} /></div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-brand-name">Fathom Marine</div>
            <div className="sidebar-brand-tagline">Operations & Compliance</div>
          </div>
          <button className="md-hide" onClick={close} style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: 'var(--text-inverse-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
        <span className="nav-label">Main</span>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/compliance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} /> Compliance
        </NavLink>

        <span className="nav-label">Operations</span>
        <NavLink to="/maintenance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wrench size={18} /> Maintenance
        </NavLink>
        <NavLink to="/drills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Shield size={18} /> Safety Drills
        </NavLink>

        {isAdmin && (
          <>
            <span className="nav-label">Admin</span>
            <NavLink to="/ships" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Ship size={18} /> Ships
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} /> Users
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
          <div className="user-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-muted">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary w-full" onClick={handleLogout} style={{ justifyContent: 'center' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  </>
  );
}
