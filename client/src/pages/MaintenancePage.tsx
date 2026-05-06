import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Wrench, X, MessageSquare, ChevronRight } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { MaintenanceTask, Ship, User } from '../types';
import { fmtDate, getStatusBadge, getPriorityBadge, formatStatus } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [crew, setCrew] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<MaintenanceTask | null>(null);
  const [filters, setFilters] = useState({ shipId: '', status: params.get('status') || '', priority: '', search: '' });

  const fetchTasks = async () => {
    const q = new URLSearchParams();
    if (filters.shipId) q.set('shipId', filters.shipId);
    if (filters.status && filters.status !== 'overdue') q.set('status', filters.status);
    if (filters.priority) q.set('priority', filters.priority);
    if (filters.search) q.set('search', filters.search);
    const res = await api.get(`/maintenance?${q}`);
    let data: MaintenanceTask[] = res.data.data;
    if (filters.status === 'overdue') data = data.filter(t => t.isOverdue && t.status !== 'COMPLETED');
    setTasks(data);
  };

  useEffect(() => { fetchTasks().finally(() => setLoading(false)); }, [filters]);
  useEffect(() => {
    if (isAdmin) {
      api.get('/ships').then(r => setShips(r.data.data));
      api.get('/users/crew').then(r => setCrew(r.data.data));
    }
  }, [isAdmin]);

  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const openEdit = (t: MaintenanceTask) => { setEditTask(t); setShowModal(true); };

  return (
    <>
      <Topbar title="Maintenance" actions={isAdmin ? <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Task</button> : undefined} />
      <div className="page-content animate-fade">
        <div className="page-header">
          <h2 className="page-title">Maintenance Tasks</h2>
          <p className="page-subtitle">Track and manage ship maintenance activities</p>
        </div>

        <div className="filter-bar">
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input search-input" style={{ paddingLeft: '2.2rem' }} placeholder="Search tasks…"
              value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          {isAdmin && (
            <select className="form-select" value={filters.shipId} onChange={e => setFilters(f => ({ ...f, shipId: e.target.value }))}>
              <option value="">All Ships</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="form-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="form-select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {(filters.search || filters.shipId || filters.status || filters.priority) && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ shipId: '', status: '', priority: '', search: '' })}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state"><Wrench size={48} /><h3>No tasks found</h3><p>Adjust filters or create a new task</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Ship</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/maintenance/${task.id}`)}>
                    <td>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                      <div className="text-xs text-muted truncate" style={{ maxWidth: 200 }}>{task.description}</div>
                    </td>
                    <td>{task.ship?.name || '—'}</td>
                    <td><span className={getPriorityBadge(task.priority)}>{task.priority}</span></td>
                    <td>
                      <span className={getStatusBadge(task.status, task.isOverdue)}>
                        {task.isOverdue && task.status !== 'COMPLETED' ? 'OVERDUE' : formatStatus(task.status)}
                      </span>
                    </td>
                    <td>{task.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                    <td style={{ color: task.isOverdue && task.status !== 'COMPLETED' ? 'var(--red-600)' : 'inherit' }}>
                      {fmtDate(task.dueDate)}
                    </td>
                    <td>
                      {(task._count?.comments || 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted"><MessageSquare size={13} />{task._count?.comments}</span>
                      )}
                    </td>
                    <td onClick={e => { e.stopPropagation(); isAdmin && openEdit(task); }}>
                      {isAdmin && <button className="btn btn-secondary btn-sm"><ChevronRight size={14} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          ships={ships}
          crew={crew}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchTasks(); }}
        />
      )}
    </>
  );
}

function TaskModal({ task, ships, crew, onClose, onSave }: {
  task: MaintenanceTask | null; ships: Ship[]; crew: User[];
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    shipId: task?.shipId || '',
    assignedToId: task?.assignedToId || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'PENDING',
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!form.title || !form.shipId || !form.dueDate) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      if (task) await api.put(`/maintenance/${task.id}`, form);
      else await api.post('/maintenance', form);
      toast.success(task ? 'Task updated' : 'Task created');
      onSave();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/maintenance/${task!.id}`); toast.success('Deleted'); onSave(); }
    catch { toast.error('Delete failed'); }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Maintenance Task'}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description *</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Ship *</label>
              <select className="form-select" value={form.shipId} onChange={e => set('shipId', e.target.value)}>
                <option value="">Select ship</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Assign To</label>
              <select className="form-select" value={form.assignedToId} onChange={e => set('assignedToId', e.target.value)}>
                <option value="">Unassigned</option>
                {crew.filter(c => !form.shipId || c.shipId === form.shipId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Due Date *</label><input type="date" className="form-input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
          </div>
          {task && (
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {task && <button className="btn btn-danger" onClick={del}>Delete</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>
            {saving ? 'Saving…' : task ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
