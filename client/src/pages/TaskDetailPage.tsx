import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { MaintenanceTask, TaskComment } from '../types';
import { fmtDate, fmtDateTime, getStatusBadge, getPriorityBadge, formatStatus } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetch = async () => {
    const res = await api.get(`/maintenance/${id}`);
    setTask(res.data.data);
  };

  useEffect(() => { fetch().finally(() => setLoading(false)); }, [id]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/maintenance/${id}/comments`, { content: comment });
      setComment('');
      fetch();
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/maintenance/${id}`, { status });
      toast.success('Status updated');
      fetch();
    } catch { toast.error('Update failed'); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <><Topbar title="Task Detail" /><div className="loading-center"><div className="spinner" /></div></>;
  if (!task) return <><Topbar title="Not Found" /><div className="page-content"><p>Task not found</p></div></>;

  const canUpdateStatus = isAdmin || task.assignedToId === user?.id;
  const isOverdueTask = task.isOverdue && task.status !== 'COMPLETED';

  return (
    <>
      <Topbar title="Task Detail" />
      <div className="page-content animate-fade">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/maintenance')}>
          <ArrowLeft size={14} /> Back to Maintenance
        </button>

        <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start' }}>
          {/* Main info */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className={getStatusBadge(task.status, task.isOverdue)}>
                  {isOverdueTask ? 'OVERDUE' : formatStatus(task.status)}
                </span>
                <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
              </div>
              <h2 style={{ marginBottom: '0.75rem' }}>{task.title}</h2>
              <p style={{ lineHeight: 1.7 }}>{task.description}</p>

              <div className="divider" />
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div><div className="text-xs text-muted">Ship</div><div className="text-sm font-semibold mt-1">{task.ship?.name || '—'}</div></div>
                <div><div className="text-xs text-muted">Assigned To</div><div className="text-sm font-semibold mt-1">{task.assignedTo?.name || 'Unassigned'}</div></div>
                <div><div className="text-xs text-muted">Due Date</div><div className="text-sm font-semibold mt-1" style={{ color: isOverdueTask ? 'var(--red-600)' : 'inherit' }}>{fmtDate(task.dueDate)}</div></div>
                <div><div className="text-xs text-muted">Created By</div><div className="text-sm font-semibold mt-1">{task.createdBy?.name || '—'}</div></div>
                {task.completedAt && <div><div className="text-xs text-muted">Completed</div><div className="text-sm font-semibold mt-1" style={{ color: 'var(--green-600)' }}>{fmtDate(task.completedAt)}</div></div>}
              </div>
            </div>

            {/* Status update */}
            {canUpdateStatus && task.status !== 'COMPLETED' && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Update Status</h4>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {task.status === 'PENDING' && (
                    <button className="btn btn-secondary" onClick={() => updateStatus('IN_PROGRESS')} disabled={updatingStatus}>
                      Start Task
                    </button>
                  )}
                  <button className="btn btn-success" onClick={() => updateStatus('COMPLETED')} disabled={updatingStatus}>
                    ✓ Mark Complete
                  </button>
                </div>
              </div>
            )}
            {task.status === 'COMPLETED' && (
              <div className="alert alert-success"><span>✓ This task was completed on {fmtDate(task.completedAt)}</span></div>
            )}
          </div>

          {/* Comments */}
          <div className="card flex flex-col" style={{ gap: '1rem' }}>
            <h4>Comments & Notes ({task.comments?.length || 0})</h4>
            <div className="flex flex-col gap-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {(task.comments || []).length === 0 ? (
                <div className="empty-state" style={{ padding: '1rem' }}><p>No comments yet</p></div>
              ) : (
                task.comments!.map((c: TaskComment) => (
                  <div key={c.id} style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                      <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                        {c.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold">{c.user.name}</span>
                      <span className="text-xs text-muted">{fmtDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2">
              <textarea className="form-textarea" placeholder="Add a comment or note…" value={comment} onChange={e => setComment(e.target.value)} style={{ minHeight: 80 }} />
              <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={submitComment} disabled={submitting || !comment.trim()}>
                <Send size={15} /> {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
