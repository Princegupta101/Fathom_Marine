import type { ReactNode } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

export default function Topbar({ title, actions }: { title: string; actions?: ReactNode }) {
  const { user } = useAuth();
  const { toggle } = useSidebar();
  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="btn btn-secondary btn-icon md-hide" onClick={toggle}>
          <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 className="truncate" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>
          {user?.ship && (
            <span className="text-xs text-muted truncate" style={{ display: 'block' }}>{user.ship.name}</span>
          )}
        </div>
      </div>
      <div className="topbar-right">
        {actions}
        <button className="btn btn-secondary btn-icon" style={{ position: 'relative' }}>
          <Bell size={18} />
        </button>
        <div className="user-chip">
          <div className="user-avatar">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="text-sm">{user?.name?.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
}
