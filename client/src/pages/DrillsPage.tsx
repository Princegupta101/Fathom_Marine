import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, X, Shield, ChevronRight } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import  type { SafetyDrill, Ship } from '../types';
import { fmtDateTime, getStatusBadge, formatStatus, formatDrillType } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DrillsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [drills, setDrills] = useState<SafetyDrill[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDrill, setEditDrill] = useState<SafetyDrill | null>(null);
  const [filters, setFilters] = useState({ shipId: '', status: params.get('status') || '', type: '' });

  const fetchDrills = async () => {
    const q = new URLSearchParams();
    if (filters.shipId) q.set('shipId', filters.shipId);
    if (filters.status) q.set('status', filters.status);
    if (filters.type) q.set('type', filters.type);
    const res = await api.get(`/drills?${q}`);
    setDrills(res.data.data);
  };

  useEffect(() => { fetchDrills().finally(() => setLoading(false)); }, [filters]);
  useEffect(() => { if (isAdmin) api.get('/ships').then(r => setShips(r.data.data)); }, [isAdmin]);

  const drillTypeOptions = ['FIRE_DRILL', 'EVACUATION', 'MAN_OVERBOARD', 'COLLISION', 'FLOODING', 'MEDICAL_EMERGENCY'];

  return (
    <>
      <Topbar title="Safety Drills" actions={isAdmin ? <button className="btn btn-primary" onClick={() => { setEditDrill(null); setShowModal(true); }}><Plus size={16} /> Schedule Drill</button> : undefined} />
      <div className="page-content animate-fade">
        <div className="page-header">
          <h2 className="page-title">Safety Drills</h2>
          <p className="page-subtitle">Schedule and track mandatory safety drills across the fleet</p>
        </div>

        <div className="filter-bar">
          {isAdmin && (
            <select className="form-select" value={filters.shipId} onChange={e => setFilters(f => ({ ...f, shipId: e.target.value }))}>
              <option value="">All Ships</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
          <select className="form-select" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {drillTypeOptions.map(t => <option key={t} value={t}>{formatDrillType(t)}</option>)}
          </select>
          {(filters.shipId || filters.status || filters.type) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ shipId: '', status: '', type: '' })}><X size={14} /> Clear</button>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : drills.length === 0 ? (
          <div className="empty-state"><Shield size={48} /><h3>No drills found</h3></div>
        ) : (
          <div className="grid-2" style={{ gap: '1rem' }}>
            {drills.map(drill => (
              <DrillCard key={drill.id} drill={drill} isAdmin={isAdmin}
                onClick={() => navigate(`/drills/${drill.id}`)}
                onEdit={() => { setEditDrill(drill); setShowModal(true); }} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <DrillModal drill={editDrill} ships={ships} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchDrills(); }} />
      )}
    </>
  );
}

function DrillCard({ drill, isAdmin, onClick, onEdit }: { drill: SafetyDrill; isAdmin: boolean; onClick: () => void; onEdit: () => void }) {
  const statusColor = drill.status === 'MISSED' ? 'var(--red-600)' : drill.status === 'COMPLETED' ? 'var(--green-600)' : drill.status === 'SCHEDULED' ? 'var(--teal-600)' : 'var(--ocean-600)';
  return (
    <div className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${statusColor}` }} onClick={onClick}>
      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
        <span className={getStatusBadge(drill.status)}>{formatStatus(drill.status)}</span>
        {isAdmin && (
          <button className="btn btn-secondary btn-sm btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }}><ChevronRight size={14} /></button>
        )}
      </div>
      <h4 style={{ marginBottom: '0.25rem' }}>{drill.title}</h4>
      <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>{formatDrillType(drill.type)}</div>
      <p className="text-sm truncate">{drill.description}</p>
      <div className="divider" />
      <div className="flex justify-between text-xs text-muted">
        <span>🚢 {drill.ship?.name}</span>
        <span>📅 {fmtDateTime(drill.scheduledAt)}</span>
      </div>
      {drill._count && <div className="text-xs text-muted mt-1">👥 {drill._count.attendances} crew members</div>}
    </div>
  );
}

function DrillModal({ drill, ships, onClose, onSave }: { drill: SafetyDrill | null; ships: Ship[]; onClose: () => void; onSave: () => void }) {
  const drillTypes = ['FIRE_DRILL', 'EVACUATION', 'MAN_OVERBOARD', 'COLLISION', 'FLOODING', 'MEDICAL_EMERGENCY'];
  const [form, setForm] = useState({
    title: drill?.title || '',
    type: drill?.type || 'FIRE_DRILL',
    description: drill?.description || '',
    shipId: drill?.shipId || '',
    scheduledAt: drill?.scheduledAt ? drill.scheduledAt.slice(0, 16) : '',
    location: drill?.location || '',
    instructions: drill?.instructions || '',
    status: drill?.status || 'SCHEDULED',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.title || !form.shipId || !form.scheduledAt) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      if (drill) await api.put(`/drills/${drill.id}`, form);
      else await api.post('/drills', form);
      toast.success(drill ? 'Drill updated' : 'Drill scheduled');
      onSave();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm('Delete this drill?')) return;
    try { await api.delete(`/drills/${drill!.id}`); toast.success('Deleted'); onSave(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{drill ? 'Edit Drill' : 'Schedule Safety Drill'}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Drill Type *</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                {drillTypes.map(t => <option key={t} value={t}>{formatDrillType(t)}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Ship *</label>
              <select className="form-select" value={form.shipId} onChange={e => set('shipId', e.target.value)}>
                <option value="">Select ship</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Scheduled Date & Time *</label><input type="datetime-local" className="form-input" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Engine Room" /></div>
          </div>
          <div className="form-group"><label className="form-label">Instructions</label><textarea className="form-textarea" value={form.instructions} onChange={e => set('instructions', e.target.value)} style={{ minHeight: 70 }} /></div>
          {drill && (
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {drill && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? 'Saving…' : drill ? 'Update' : 'Schedule'}</button>
        </div>
      </div>
    </div>
  );
}
