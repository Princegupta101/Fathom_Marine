import type { TaskStatus, Priority, DrillStatus, DrillType } from '../types';
import { format, isAfter, parseISO } from 'date-fns';

export function getStatusBadge(status: TaskStatus | DrillStatus | string, isOverdue?: boolean) {
  if (isOverdue && status !== 'COMPLETED') return 'badge badge-overdue';
  const map: Record<string, string> = {
    PENDING: 'badge badge-pending',
    IN_PROGRESS: 'badge badge-in-progress',
    COMPLETED: 'badge badge-completed',
    SCHEDULED: 'badge badge-scheduled',
    MISSED: 'badge badge-missed',
    IN_PROGRESS_DRILL: 'badge badge-in-progress',
  };
  return map[status] || 'badge badge-pending';
}

export function getPriorityBadge(priority: Priority | string) {
  const map: Record<string, string> = {
    CRITICAL: 'badge badge-critical',
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
  };
  return map[priority] || 'badge badge-medium';
}

export function formatStatus(s: string) {
  return s.replace(/_/g, ' ');
}

export function formatDrillType(t: DrillType | string) {
  const map: Record<string, string> = {
    FIRE_DRILL: '🔥 Fire Drill',
    EVACUATION: '🚨 Evacuation',
    MAN_OVERBOARD: '🌊 Man Overboard',
    COLLISION: '⚓ Collision',
    FLOODING: '💧 Flooding',
    MEDICAL_EMERGENCY: '🏥 Medical Emergency',
  };
  return map[t] || t;
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy'); }
  catch { return '—'; }
}

export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return '—';
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy HH:mm'); }
  catch { return '—'; }
}

export function isOverdue(dueDate: string, status: string) {
  return status !== 'COMPLETED' && isAfter(new Date(), parseISO(dueDate));
}

export function getComplianceColor(rate: number) {
  if (rate >= 80) return 'var(--green-600)';
  if (rate >= 60) return 'var(--amber-600)';
  return 'var(--red-600)';
}

export function getProgressClass(rate: number) {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'amber';
  return 'red';
}
