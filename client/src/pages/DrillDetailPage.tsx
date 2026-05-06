import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Users } from 'lucide-react';
import Topbar from '../components/Topbar';
import api from '../lib/api';
import type { SafetyDrill, DrillAttendance } from '../types';
import { fmtDateTime, fmtDate, getStatusBadge, formatStatus, formatDrillType } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DrillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [drill, setDrill] = useState<SafetyDrill | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [attending, setAttending] = useState(false);

  const fetch = async () => {
    const res = await api.get(`/drills/${id}`);
    setDrill(res.data.data);
  };

  useEffect(() => { fetch().finally(() => setLoading(false)); }, [id]);

  const myAttendance = drill?.attendances?.find((a: DrillAttendance) => a.userId === user?.id);

  const markAttendance = async () => {
    setAttending(true);
    try {
      await api.post(`/drills/${id}/attend`, { notes });
      toast.success('Attendance marked!');
      fetch();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setAttending(false); }
  };

  if (loading) return <><Topbar title="Drill Detail" /><div className="loading-center"><div className="spinner" /></div></>;
  if (!drill) return <><Topbar title="Not Found" /><div className="page-content"><p>Drill not found</p></div></>;

  const attendedCount = drill.attendances?.filter((a: DrillAttendance) => a.attended).length || 0;
  const totalCount = drill.attendances?.length || 0;
  const rate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  return (
    <>
      <Topbar title="Drill Detail" />
      <div className="page-content animate-fade">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/drills')}>
          <ArrowLeft size={14} /> Back to Drills
        </button>

        <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start' }}>
          <div className="flex flex-col gap-4">
            <div className="card">
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <span className={getStatusBadge(drill.status)}>{formatStatus(drill.status)}</span>
                <span className="text-sm text-muted">{formatDrillType(drill.type)}</span>
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>{drill.title}</h2>
              <p>{drill.description}</p>
              <div className="divider" />
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div><div className="text-xs text-muted">Ship</div><div className="text-sm font-semibold mt-1">{drill.ship?.name}</div></div>
                <div><div className="text-xs text-muted">Scheduled</div><div className="text-sm font-semibold mt-1">{fmtDateTime(drill.scheduledAt)}</div></div>
                {drill.location && <div><div className="text-xs text-muted">Location</div><div className="text-sm font-semibold mt-1">{drill.location}</div></div>}
                {drill.completedAt && <div><div className="text-xs text-muted">Completed</div><div className="text-sm font-semibold mt-1" style={{ color: 'var(--green-600)' }}>{fmtDate(drill.completedAt)}</div></div>}
              </div>
              {drill.instructions && (
                <>
                  <div className="divider" />
                  <div className="text-xs text-muted" style={{ marginBottom: '0.35rem' }}>Instructions</div>
                  <p className="text-sm">{drill.instructions}</p>
                </>
              )}
            </div>

            {/* Crew attendance action */}
            {!isAdmin && drill.status !== 'MISSED' && drill.status !== 'COMPLETED' && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Mark Your Attendance</h4>
                {myAttendance?.attended ? (
                  <div className="alert alert-success"><CheckCircle size={16} /> You have marked attendance for this drill.</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="form-group">
                      <label className="form-label">Notes (optional)</label>
                      <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any notes about your participation…" style={{ minHeight: 70 }} />
                    </div>
                    <button className="btn btn-success" onClick={markAttendance} disabled={attending}>
                      <CheckCircle size={16} /> {attending ? 'Submitting…' : 'Submit Attendance'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {drill.status === 'MISSED' && (
              <div className="alert alert-danger"><XCircle size={16} /> This drill was missed and is now marked as non-compliant.</div>
            )}
          </div>

          {/* Attendance list */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h4 className="flex items-center gap-2"><Users size={18} /> Crew Attendance</h4>
              <span style={{ color: rate >= 80 ? 'var(--green-600)' : rate >= 60 ? 'var(--amber-600)' : 'var(--red-600)', fontWeight: 700 }}>{attendedCount}/{totalCount} ({rate}%)</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: '1rem' }}>
              <div className={`progress-fill ${rate >= 80 ? 'green' : rate >= 60 ? 'amber' : 'red'}`} style={{ width: `${rate}%` }} />
            </div>
            {totalCount === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}><p>No crew assigned to this drill</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {drill.attendances?.map((a: DrillAttendance) => (
                  <div key={a.id} className="flex items-center justify-between" style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                        {a.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{a.user?.name}</div>
                        {a.notes && <div className="text-xs text-muted">{a.notes}</div>}
                      </div>
                    </div>
                    {a.attended
                      ? <CheckCircle size={18} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
                      : <XCircle size={18} style={{ color: 'var(--red-600)', flexShrink: 0 }} />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
