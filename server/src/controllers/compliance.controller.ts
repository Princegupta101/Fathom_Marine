import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getComplianceDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shipId } = req.query;

    const shipFilter = shipId ? { shipId: shipId as string } : {};
    const userShipFilter = (req.user!.role === 'CREW' && req.user!.shipId)
      ? { shipId: req.user!.shipId }
      : shipFilter;

    const [totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks] = await Promise.all([
      prisma.maintenanceTask.count({ where: userShipFilter }),
      prisma.maintenanceTask.count({ where: { ...userShipFilter, status: 'COMPLETED' } }),
      prisma.maintenanceTask.count({ where: { ...userShipFilter, status: 'PENDING' } }),
      prisma.maintenanceTask.count({ where: { ...userShipFilter, status: 'IN_PROGRESS' } }),
      prisma.maintenanceTask.count({ where: { ...userShipFilter, isOverdue: true, status: { not: 'COMPLETED' } } }),
    ]);

    const [totalDrills, completedDrills, scheduledDrills, missedDrills] = await Promise.all([
      prisma.safetyDrill.count({ where: userShipFilter }),
      prisma.safetyDrill.count({ where: { ...userShipFilter, status: 'COMPLETED' } }),
      prisma.safetyDrill.count({ where: { ...userShipFilter, status: 'SCHEDULED' } }),
      prisma.safetyDrill.count({ where: { ...userShipFilter, status: 'MISSED' } }),
    ]);

    const totalAttendances = await prisma.drillAttendance.count({
      where: {
        drill: userShipFilter,
      },
    });
    const attendedCount = await prisma.drillAttendance.count({
      where: {
        drill: userShipFilter,
        attended: true,
      },
    });

    const maintenanceComplianceRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 100;

    const drillParticipationRate = totalAttendances > 0
      ? Math.round((attendedCount / totalAttendances) * 100)
      : 100;

    const overallComplianceRate = Math.round(
      (maintenanceComplianceRate * 0.5) + (drillParticipationRate * 0.5)
    );

    const overdueTasksList = await prisma.maintenanceTask.findMany({
      where: { ...userShipFilter, isOverdue: true, status: { not: 'COMPLETED' } },
      include: {
        ship: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    const missedDrillsList = await prisma.safetyDrill.findMany({
      where: { ...userShipFilter, status: 'MISSED' },
      include: { ship: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 5,
    });

    let perShipCompliance: any[] = [];
    if (req.user!.role === 'ADMIN') {
      const ships = await prisma.ship.findMany({ select: { id: true, name: true } });

      perShipCompliance = await Promise.all(ships.map(async (ship) => {
        const [sTotal, sCompleted, dTotal, dCompleted, dAttended, dAttendances] = await Promise.all([
          prisma.maintenanceTask.count({ where: { shipId: ship.id } }),
          prisma.maintenanceTask.count({ where: { shipId: ship.id, status: 'COMPLETED' } }),
          prisma.safetyDrill.count({ where: { shipId: ship.id } }),
          prisma.safetyDrill.count({ where: { shipId: ship.id, status: 'COMPLETED' } }),
          prisma.drillAttendance.count({ where: { drill: { shipId: ship.id }, attended: true } }),
          prisma.drillAttendance.count({ where: { drill: { shipId: ship.id } } }),
        ]);
        const mRate = sTotal > 0 ? Math.round((sCompleted / sTotal) * 100) : 100;
        const dRate = dAttendances > 0 ? Math.round((dAttended / dAttendances) * 100) : 100;
        return {
          ship,
          maintenanceTotal: sTotal,
          maintenanceCompleted: sCompleted,
          drillTotal: dTotal,
          drillCompleted: dCompleted,
          maintenanceComplianceRate: mRate,
          drillParticipationRate: dRate,
          overallComplianceRate: Math.round((mRate * 0.5) + (dRate * 0.5)),
        };
      }));
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTasks = await prisma.maintenanceTask.findMany({
      where: { ...userShipFilter, createdAt: { gte: sixMonthsAgo } },
      select: { status: true, completedAt: true, createdAt: true, isOverdue: true },
    });

    const monthlyDrills = await prisma.safetyDrill.findMany({
      where: { ...userShipFilter, scheduledAt: { gte: sixMonthsAgo } },
      select: { status: true, scheduledAt: true },
    });

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), date: d };
    });

    const trendData = months.map(({ month, year, date }) => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTasks = monthlyTasks.filter(t => {
        const d = new Date(t.createdAt);
        return d >= startOfMonth && d <= endOfMonth;
      });
      const monthCompleted = monthTasks.filter(t => t.status === 'COMPLETED').length;
      const monthTotal = monthTasks.length;

      const monthDrills = monthlyDrills.filter(d => {
        const sd = new Date(d.scheduledAt);
        return sd >= startOfMonth && sd <= endOfMonth;
      });
      const monthDrillCompleted = monthDrills.filter(d => d.status === 'COMPLETED').length;
      const monthDrillTotal = monthDrills.length;

      return {
        month: `${month} ${year}`,
        maintenanceRate: monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0,
        drillRate: monthDrillTotal > 0 ? Math.round((monthDrillCompleted / monthDrillTotal) * 100) : 0,
        taskCount: monthTotal,
        drillCount: monthDrillTotal,
      };
    });

    res.json({
      success: true,
      data: {
        maintenance: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
          complianceRate: maintenanceComplianceRate,
        },
        drills: {
          total: totalDrills,
          completed: completedDrills,
          scheduled: scheduledDrills,
          missed: missedDrills,
          participationRate: drillParticipationRate,
        },
        overallComplianceRate,
        overdueTasksList,
        missedDrillsList,
        perShipCompliance,
        trendData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch compliance data' });
  }
};

export const getShipCompliance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shipId = req.params.shipId as string;
    const ship = await prisma.ship.findUnique({ where: { id: shipId } });
    if (!ship) {
      res.status(404).json({ success: false, message: 'Ship not found' });
      return;
    }

    const [totalTasks, completedTasks, overdueTasks, totalDrills, completedDrills, missedDrills, totalAttendances, attendedCount] = await Promise.all([
      prisma.maintenanceTask.count({ where: { shipId } }),
      prisma.maintenanceTask.count({ where: { shipId, status: 'COMPLETED' } }),
      prisma.maintenanceTask.count({ where: { shipId, isOverdue: true, status: { not: 'COMPLETED' } } }),
      prisma.safetyDrill.count({ where: { shipId } }),
      prisma.safetyDrill.count({ where: { shipId, status: 'COMPLETED' } }),
      prisma.safetyDrill.count({ where: { shipId, status: 'MISSED' } }),
      prisma.drillAttendance.count({ where: { drill: { shipId } } }),
      prisma.drillAttendance.count({ where: { drill: { shipId }, attended: true } }),
    ]);

    const mRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
    const dRate = totalAttendances > 0 ? Math.round((attendedCount / totalAttendances) * 100) : 100;

    res.json({
      success: true,
      data: {
        ship,
        maintenance: { total: totalTasks, completed: completedTasks, overdue: overdueTasks, complianceRate: mRate },
        drills: { total: totalDrills, completed: completedDrills, missed: missedDrills, participationRate: dRate },
        overallComplianceRate: Math.round((mRate * 0.5) + (dRate * 0.5)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ship compliance' });
  }
};
