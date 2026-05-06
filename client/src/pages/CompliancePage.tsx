import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { ComplianceDashboard, Ship } from '../types';
import { getComplianceColor, getProgressClass } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Wrench, AlertTriangle } from 'lucide-react';

export default function CompliancePage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const q = selectedShip ? `?shipId=${selectedShip}` : '';
    const res = await api.get(`/compliance/dashboard${q}`);
    setData(res.data.data);
  };

  useEffect(() => {
    api.get('/ships').then(r => setShips(r.data.data));
  }, []);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [selectedShip]);

  if (loading) return <><Topbar title="Compliance" /><div className="loading-center"><div className="spinner" /></div></>;
  if (!data) return null;

  const { maintenance, drills, overallComplianceRate, trendData, perShipCompliance } = data;

  const barData = [
    { name: 'Completed', maintenance: maintenance.completed, drills: drills.completed, fill: 'var(--green-600)' },
    { name: 'Pending', maintenance: maintenance.pending, drills: drills.scheduled, fill: 'var(--amber-600)' },
    { name: 'Overdue/Missed', maintenance: maintenance.overdue, drills: drills.missed, fill: 'var(--red-600)' },
  ];

  return (
    <>
      <Topbar title="Compliance Dashboard" />
      <div className="page-content animate-fade">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="page-title">Compliance Dashboard</h2>
            <p className="page-subtitle">Track regulatory compliance across your fleet</p>
          </div>
          {isAdmin && (
            <select className="form-select" value={selectedShip} onChange={e => setSelectedShip(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Ships</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(20,184,166,0.05))', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Overall Fleet Compliance Score</div>
              <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: getComplianceColor(overallComplianceRate), lineHeight: 1 }}>{overallComplianceRate}%</div>
              <div className="progress-bar" style={{ width: 300, marginTop: '0.75rem' }}>
                <div className={`progress-fill ${getProgressClass(overallComplianceRate)}`} style={{ width: `${overallComplianceRate}%` }} />
              </div>
              <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                {overallComplianceRate >= 80 ? '✅ Fleet is compliant' : overallComplianceRate >= 60 ? '⚠️ Needs attention' : '🚨 Critical compliance issues'}
              </div>
            </div>
            <div className="grid-2" style={{ gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: getComplianceColor(maintenance.complianceRate) }}>{maintenance.complianceRate}%</div>
                <div className="text-xs text-muted">Maintenance</div>
                <div className="progress-bar" style={{ marginTop: '0.4rem' }}><div className={`progress-fill ${getProgressClass(maintenance.complianceRate)}`} style={{ width: `${maintenance.complianceRate}%` }} /></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: getComplianceColor(drills.participationRate) }}>{drills.participationRate}%</div>
                <div className="text-xs text-muted">Drill Participation</div>
                <div className="progress-bar" style={{ marginTop: '0.4rem' }}><div className={`progress-fill ${getProgressClass(drills.participationRate)}`} style={{ width: `${drills.participationRate}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Tasks', value: maintenance.total, icon: <Wrench size={20} />, color: 'var(--ocean-600)', cls: 'accent' },
            { label: 'Overdue Tasks', value: maintenance.overdue, icon: <AlertTriangle size={20} />, color: 'var(--red-600)', cls: 'danger' },
            { label: 'Total Drills', value: drills.total, icon: <Shield size={20} />, color: 'var(--teal-600)', cls: 'teal' },
            { label: 'Missed Drills', value: drills.missed, icon: <AlertTriangle size={20} />, color: 'var(--amber-600)', cls: 'warning' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                <div style={{ color: s.color, background: `${s.color}20`, padding: '0.4rem', borderRadius: 8 }}>{s.icon}</div>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-value" style={{ color: s.value > 0 && (s.label.includes('Overdue') || s.label.includes('Missed')) ? s.color : undefined }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Activity Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                <Bar dataKey="maintenance" name="Maintenance" fill="var(--ocean-600)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="drills" name="Drills" fill="var(--teal-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>6-Month Compliance Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="maintenanceRate" name="Maintenance %" fill="var(--ocean-600)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="drillRate" name="Drill %" fill="var(--teal-600)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdmin && perShipCompliance.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Ship-by-Ship Breakdown</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ship</th>
                    <th>Maint. Tasks</th>
                    <th>Maint. Rate</th>
                    <th>Drills</th>
                    <th>Drill Rate</th>
                    <th>Overall Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perShipCompliance.map(s => (
                    <tr key={s.ship.id}>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.ship.name}</td>
                      <td>{s.maintenanceCompleted}/{s.maintenanceTotal}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${getProgressClass(s.maintenanceComplianceRate)}`} style={{ width: `${s.maintenanceComplianceRate}%` }} /></div>
                          <span style={{ color: getComplianceColor(s.maintenanceComplianceRate), fontWeight: 600, fontSize: '0.8rem' }}>{s.maintenanceComplianceRate}%</span>
                        </div>
                      </td>
                      <td>{s.drillCompleted}/{s.drillTotal}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar" style={{ width: 60 }}><div className={`progress-fill ${getProgressClass(s.drillParticipationRate)}`} style={{ width: `${s.drillParticipationRate}%` }} /></div>
                          <span style={{ color: getComplianceColor(s.drillParticipationRate), fontWeight: 600, fontSize: '0.8rem' }}>{s.drillParticipationRate}%</span>
                        </div>
                      </td>
                      <td style={{ color: getComplianceColor(s.overallComplianceRate), fontWeight: 700 }}>{s.overallComplianceRate}%</td>
                      <td>
                        <span className={`badge ${s.overallComplianceRate >= 80 ? 'badge-completed' : s.overallComplianceRate >= 60 ? 'badge-pending' : 'badge-overdue'}`}>
                          {s.overallComplianceRate >= 80 ? 'Compliant' : s.overallComplianceRate >= 60 ? 'At Risk' : 'Non-Compliant'}
                        </span>
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
