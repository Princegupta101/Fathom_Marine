import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { User, Ship } from '../types';
import { fmtDate } from '../lib/utils';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = () => api.get('/users').then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  useEffect(() => {
    fetchUsers();
    api.get('/ships').then(r => setShips(r.data.data));
  }, []);

  return (
    <>
      <Topbar title="Users" actions={<button className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true); }}><Plus size={16} /> Add User</button>} />
      <div className="page-content animate-fade">
        <div className="page-header">
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Manage crew members and administrators</p>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> :
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Ship</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-high' : 'badge-in-progress'}`}>{u.role}</span></td>
                    <td>{(u as any).ship?.name || <span className="text-muted">—</span>}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(u); setShowModal(true); }}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
      {showModal && <UserModal user={editUser} ships={ships} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchUsers(); }} />}
    </>
  );
}

function UserModal({ user, ships, onClose, onSave }: { user: User | null; ships: Ship[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', role: user?.role || 'CREW', shipId: user?.shipId || '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    setSaving(true);
    try {
      if (user) {
        const payload: any = { name: form.name, email: form.email, role: form.role, shipId: form.shipId || null };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${user.id}`, payload);
        toast.success('User updated');
      } else {
        if (!form.password) { toast.error('Password required'); setSaving(false); return; }
        await api.post('/auth/register', { ...form, shipId: form.shipId || null });
        toast.success('User created');
      }
      onSave();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/users/${user!.id}`); toast.success('Deleted'); onSave(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{user ? 'Edit User' : 'Create User'}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="CREW">Crew</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Assign to Ship</label>
              <select className="form-select" value={form.shipId} onChange={e => set('shipId', e.target.value)}>
                <option value="">No Ship</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {user && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? 'Saving…' : user ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
