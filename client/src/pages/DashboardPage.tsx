import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Shield, AlertTriangle, CheckCircle2, TrendingUp, Ship, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { ComplianceDashboard } from '../types';
import { fmtDate, getComplianceColor, getProgressClass } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/compliance/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      <Topbar title="Dashboard" />
      <div className="loading-center"><div className="spinner" /><span className="text-muted">Loading dashboard…</span></div>
    </>
  );

  if (!data) return null;
  const { maintenance, drills, overallComplianceRate, overdueTasksList, missedDrillsList, trendData } = data;
  const compColor = getComplianceColor(overallComplianceRate);

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="page-content animate-fade">
        <div className="page-header">
          <h2 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">Here's your fleet operations overview</p>
        </div>

        <div className="grid-stat">
          <div className="stat-card accent">
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--ocean-600)', background: 'rgba(37,99,235,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Wrench size={20} /></div>
              <span className="stat-label">Maintenance Tasks</span>
            </div>
            <div className="stat-value">{maintenance.total}</div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs" style={{ color: 'var(--green-600)' }}>✓ {maintenance.completed} done</span>
              <span className="text-xs" style={{ color: 'var(--amber-600)' }}>◷ {maintenance.pending} pending</span>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--red-600)', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '8px' }}><AlertTriangle size={20} /></div>
              <span className="stat-label">Overdue Tasks</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--red-600)' }}>{maintenance.overdue}</div>
            <div className="mt-2">
              <div className="progress-bar"><div className={`progress-fill red`} style={{ width: `${maintenance.total ? (maintenance.overdue / maintenance.total) * 100 : 0}%` }} /></div>
            </div>
          </div>

          <div className="stat-card teal">
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--teal-600)', background: 'rgba(13,148,136,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Shield size={20} /></div>
              <span className="stat-label">Safety Drills</span>
            </div>
            <div className="stat-value">{drills.total}</div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs" style={{ color: 'var(--green-600)' }}>✓ {drills.completed} done</span>
              <span className="text-xs" style={{ color: 'var(--red-600)' }}>✗ {drills.missed} missed</span>
            </div>
          </div>

          <div className="stat-card success">
            <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--green-600)', background: 'rgba(34,197,94,0.1)', padding: '0.5rem', borderRadius: '8px' }}><TrendingUp size={20} /></div>
              <span className="stat-label">Overall Compliance</span>
            </div>
            <div className="stat-value" style={{ color: compColor }}>{overallComplianceRate}%</div>
            <div className="mt-2">
              <div className="progress-bar"><div className={`progress-fill ${getProgressClass(overallComplianceRate)}`} style={{ width: `${overallComplianceRate}%` }} /></div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Compliance Rates</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm" style={{ marginBottom: '0.4rem' }}>
                  <span>Maintenance Compliance</span>
                  <span style={{ color: getComplianceColor(maintenance.complianceRate), fontWeight: 600 }}>{maintenance.complianceRate}%</span>
                </div>
                <div className="progress-bar"><div className={`progress-fill ${getProgressClass(maintenance.complianceRate)}`} style={{ width: `${maintenance.complianceRate}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm" style={{ marginBottom: '0.4rem' }}>
                  <span>Drill Participation</span>
                  <span style={{ color: getComplianceColor(drills.participationRate), fontWeight: 600 }}>{drills.participationRate}%</span>
                </div>
                <div className="progress-bar"><div className={`progress-fill ${getProgressClass(drills.participationRate)}`} style={{ width: `${drills.participationRate}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm" style={{ marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>Overall Score</span>
                  <span style={{ color: compColor, fontWeight: 700 }}>{overallComplianceRate}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}><div className={`progress-fill ${getProgressClass(overallComplianceRate)}`} style={{ width: `${overallComplianceRate}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>6-Month Trend</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,143,212,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                  <Line type="monotone" dataKey="maintenanceRate" stroke="var(--ocean-600)" strokeWidth={2} dot={{ fill: 'var(--ocean-600)', r: 3 }} name="Maintenance %" />
                  <Line type="monotone" dataKey="drillRate" stroke="var(--teal-600)" strokeWidth={2} dot={{ fill: 'var(--teal-600)', r: 3 }} name="Drill %" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No trend data yet</p></div>}
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h3 className="flex items-center gap-2"><AlertTriangle size={18} style={{ color: 'var(--red-600)' }} /> Overdue Tasks</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/maintenance?status=overdue')}>View all <ChevronRight size={14} /></button>
            </div>
            {overdueTasksList.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}><CheckCircle2 size={32} style={{ color: 'var(--green-600)', opacity: 0.6 }} /><p className="mt-2">No overdue tasks!</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {overdueTasksList.map(t => (
                  <div key={t.id} className="flex items-center justify-between" style={{ padding: '0.625rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }} onClick={() => navigate(`/maintenance/${t.id}`)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-sm font-semibold truncate">{t.title}</div>
                      <div className="text-xs text-muted">{t.ship?.name} · Due {fmtDate(t.dueDate)}</div>
                    </div>
                    <span className="badge badge-overdue">Overdue</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h3 className="flex items-center gap-2"><Shield size={18} style={{ color: 'var(--red-600)' }} /> Missed Drills</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/drills?status=MISSED')}>View all <ChevronRight size={14} /></button>
            </div>
            {missedDrillsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}><CheckCircle2 size={32} style={{ color: 'var(--green-600)', opacity: 0.6 }} /><p className="mt-2">No missed drills!</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {missedDrillsList.map(d => (
                  <div key={d.id} className="flex items-center justify-between" style={{ padding: '0.625rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }} onClick={() => navigate(`/drills/${d.id}`)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-sm font-semibold truncate">{d.title}</div>
                      <div className="text-xs text-muted">{d.ship?.name} · {fmtDate(d.scheduledAt)}</div>
                    </div>
                    <span className="badge badge-missed">Missed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAdmin && data.perShipCompliance.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <Ship size={18} style={{ color: 'var(--ocean-600)' }} />
              <h3>Fleet Compliance Overview</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ship</th>
                    <th>Maintenance</th>
                    <th>Maintenance %</th>
                    <th>Drills</th>
                    <th>Drill %</th>
                    <th>Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perShipCompliance.map(s => (
                    <tr key={s.ship.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/compliance?ship=${s.ship.id}`)}>
                      <td className="font-semibold">{s.ship.name}</td>
                      <td>{s.maintenanceCompleted}/{s.maintenanceTotal}</td>
                      <td><span style={{ color: getComplianceColor(s.maintenanceComplianceRate), fontWeight: 600 }}>{s.maintenanceComplianceRate}%</span></td>
                      <td>{s.drillCompleted}/{s.drillTotal}</td>
                      <td><span style={{ color: getComplianceColor(s.drillParticipationRate), fontWeight: 600 }}>{s.drillParticipationRate}%</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar" style={{ width: 80 }}><div className={`progress-fill ${getProgressClass(s.overallComplianceRate)}`} style={{ width: `${s.overallComplianceRate}%` }} /></div>
                          <span style={{ color: getComplianceColor(s.overallComplianceRate), fontWeight: 700, fontSize: '0.875rem' }}>{s.overallComplianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
