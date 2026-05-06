export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CREW';
  shipId?: string | null;
  ship?: { id: string; name: string; imoNumber?: string } | null;
  createdAt?: string;
}

export interface Ship {
  id: string;
  name: string;
  imoNumber: string;
  type: string;
  flag: string;
  builtYear: number;
  grossTonnage: number;
  createdAt: string;
  _count?: { users: number; maintenanceTasks: number; safetyDrills: number };
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  shipId: string;
  ship?: { id: string; name: string };
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string };
  completedAt?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: { id: string; name: string; role: string };
  createdAt: string;
}

export type DrillType = 'FIRE_DRILL' | 'EVACUATION' | 'MAN_OVERBOARD' | 'COLLISION' | 'FLOODING' | 'MEDICAL_EMERGENCY';
export type DrillStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';

export interface SafetyDrill {
  id: string;
  title: string;
  type: DrillType;
  description: string;
  status: DrillStatus;
  scheduledAt: string;
  completedAt?: string | null;
  shipId: string;
  ship?: { id: string; name: string };
  location?: string;
  instructions?: string;
  createdAt: string;
  _count?: { attendances: number };
  attendances?: DrillAttendance[];
}

export interface DrillAttendance {
  id: string;
  drillId: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  attended: boolean;
  notes?: string;
  submittedAt?: string | null;
}

export interface ComplianceDashboard {
  maintenance: {
    total: number; completed: number; pending: number;
    inProgress: number; overdue: number; complianceRate: number;
  };
  drills: {
    total: number; completed: number; scheduled: number;
    missed: number; participationRate: number;
  };
  overallComplianceRate: number;
  overdueTasksList: MaintenanceTask[];
  missedDrillsList: SafetyDrill[];
  perShipCompliance: PerShipCompliance[];
  trendData: TrendPoint[];
}

export interface PerShipCompliance {
  ship: { id: string; name: string };
  maintenanceTotal: number;
  maintenanceCompleted: number;
  drillTotal: number;
  drillCompleted: number;
  maintenanceComplianceRate: number;
  drillParticipationRate: number;
  overallComplianceRate: number;
}

export interface TrendPoint {
  month: string;
  maintenanceRate: number;
  drillRate: number;
  taskCount: number;
  drillCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}
