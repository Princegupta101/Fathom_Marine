import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MaintenancePage from './pages/MaintenancePage';
import TaskDetailPage from './pages/TaskDetailPage';
import DrillsPage from './pages/DrillsPage';
import DrillDetailPage from './pages/DrillDetailPage';
import CompliancePage from './pages/CompliancePage';
import ShipsPage from './pages/ShipsPage';
import UsersPage from './pages/UsersPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <span style={{ color: 'var(--text-muted)' }}>Loading Fathom Marine…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <SidebarProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">{children}</div>
      </div>
    </SidebarProvider>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/maintenance" element={<ProtectedLayout><MaintenancePage /></ProtectedLayout>} />
      <Route path="/maintenance/:id" element={<ProtectedLayout><TaskDetailPage /></ProtectedLayout>} />
      <Route path="/drills" element={<ProtectedLayout><DrillsPage /></ProtectedLayout>} />
      <Route path="/drills/:id" element={<ProtectedLayout><DrillDetailPage /></ProtectedLayout>} />
      <Route path="/compliance" element={<ProtectedLayout><CompliancePage /></ProtectedLayout>} />

      <Route path="/ships" element={<ProtectedLayout><AdminRoute><ShipsPage /></AdminRoute></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><AdminRoute><UsersPage /></AdminRoute></ProtectedLayout>} />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
