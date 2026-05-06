import { useEffect, useState } from 'react';
import { Plus, X, Ship as ShipIcon, Anchor } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { Ship } from '../types';
import toast from 'react-hot-toast';

export default function ShipsPage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editShip, setEditShip] = useState<Ship | null>(null);

  const fetchShips = () => api.get('/ships').then(r => setShips(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { fetchShips(); }, []);

  return (
    <>
      <Topbar title="Ships" actions={<button className="btn btn-primary" onClick={() => { setEditShip(null); setShowModal(true); }}><Plus size={16} /> Add Ship</button>} />
      <div className="page-content animate-fade">
        <div className="page-header">
          <h2 className="page-title">Fleet Management</h2>
          <p className="page-subtitle">Manage your vessel fleet and assignments</p>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> :
          ships.length === 0 ? <div className="empty-state"><Anchor size={48} /><h3>No ships registered</h3></div> : (
            <div className="grid-3" style={{ gap: '1rem' }}>
              {ships.map(ship => (
                <div key={ship.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setEditShip(ship); setShowModal(true); }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(42,143,212,0.1)', padding: '0.625rem', borderRadius: 10, color: 'var(--ocean-600)' }}><ShipIcon size={22} /></div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ship.name}</div>
                      <div className="text-xs text-muted">{ship.imoNumber}</div>
                    </div>
                  </div>
                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div><div className="text-xs text-muted">Type</div><div className="text-sm mt-1">{ship.type}</div></div>
                    <div><div className="text-xs text-muted">Flag</div><div className="text-sm mt-1">{ship.flag}</div></div>
                    <div><div className="text-xs text-muted">Built</div><div className="text-sm mt-1">{ship.builtYear}</div></div>
                    <div><div className="text-xs text-muted">Gross Tonnage</div><div className="text-sm mt-1">{ship.grossTonnage.toLocaleString()} GT</div></div>
                  </div>
                  {ship._count && (
                    <>
                      <div className="divider" />
                      <div className="flex gap-3 text-xs text-muted">
                        <span>👥 {ship._count.users} crew</span>
                        <span>🔧 {ship._count.maintenanceTasks} tasks</span>
                        <span>🛡 {ship._count.safetyDrills} drills</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
      {showModal && <ShipModal ship={editShip} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchShips(); }} />}
    </>
  );
}

function ShipModal({ ship, onClose, onSave }: { ship: Ship | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: ship?.name || '', imoNumber: ship?.imoNumber || '', type: ship?.type || '', flag: ship?.flag || '', builtYear: String(ship?.builtYear || ''), grossTonnage: String(ship?.grossTonnage || '') });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    setSaving(true);
    try {
      if (ship) await api.put(`/ships/${ship.id}`, form);
      else await api.post('/ships', form);
      toast.success(ship ? 'Ship updated' : 'Ship registered');
      onSave();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm('Delete this ship? This will affect all related data.')) return;
    try { await api.delete(`/ships/${ship!.id}`); toast.success('Deleted'); onSave(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{ship ? 'Edit Ship' : 'Register New Ship'}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Ship Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="MV Pacific Mariner" /></div>
          <div className="form-group"><label className="form-label">IMO Number *</label><input className="form-input" value={form.imoNumber} onChange={e => set('imoNumber', e.target.value)} placeholder="IMO9234567" /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Vessel Type *</label><input className="form-input" value={form.type} onChange={e => set('type', e.target.value)} placeholder="Bulk Carrier" /></div>
            <div className="form-group"><label className="form-label">Flag State *</label><input className="form-input" value={form.flag} onChange={e => set('flag', e.target.value)} placeholder="Panama" /></div>
            <div className="form-group"><label className="form-label">Year Built *</label><input type="number" className="form-input" value={form.builtYear} onChange={e => set('builtYear', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Gross Tonnage *</label><input type="number" className="form-input" value={form.grossTonnage} onChange={e => set('grossTonnage', e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          {ship && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? 'Saving…' : ship ? 'Update' : 'Register'}</button>
        </div>
      </div>
    </div>
  );
}
