import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDrills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shipId, status, type, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (req.user!.role === 'CREW' && req.user!.shipId) {
      where.shipId = req.user!.shipId;
    }
    if (shipId) where.shipId = shipId as string;
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    await prisma.safetyDrill.updateMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { lt: new Date() },
      },
      data: { status: 'MISSED' },
    });

    const [drills, total] = await Promise.all([
      prisma.safetyDrill.findMany({
        where,
        include: {
          ship: { select: { id: true, name: true } },
          _count: { select: { attendances: true } },
          attendances: req.user!.role === 'CREW'
            ? { where: { userId: req.user!.id }, select: { attended: true, submittedAt: true } }
            : false,
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.safetyDrill.count({ where }),
    ]);

    res.json({
      success: true,
      data: drills,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch drills' });
  }
};

export const getDrillById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const drill = await prisma.safetyDrill.findUnique({
      where: { id: id as string },
      include: {
        ship: true,
        attendances: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!drill) {
      res.status(404).json({ success: false, message: 'Drill not found' });
      return;
    }
    res.json({ success: true, data: drill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch drill' });
  }
};

export const createDrill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, description, scheduledAt, shipId, location, instructions } = req.body;
    if (!title || !type || !description || !scheduledAt || !shipId) {
      res.status(400).json({ success: false, message: 'title, type, description, scheduledAt, and shipId are required' });
      return;
    }

    const drill = await prisma.safetyDrill.create({
      data: {
        title, type, description,
        scheduledAt: new Date(scheduledAt),
        shipId, location, instructions,
      },
      include: {
        ship: { select: { id: true, name: true } },
      },
    });

    const crewMembers = await prisma.user.findMany({
      where: { shipId, role: 'CREW' },
      select: { id: true },
    });

    if (crewMembers.length > 0) {
      await prisma.drillAttendance.createMany({
        data: crewMembers.map(c => ({ drillId: drill.id, userId: c.id })),
      });
    }

    res.status(201).json({ success: true, data: drill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create drill' });
  }
};

export const updateDrill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const drill = await prisma.safetyDrill.findUnique({ where: { id: id as string } });
    if (!drill) {
      res.status(404).json({ success: false, message: 'Drill not found' });
      return;
    }

    if (req.user!.role === 'ADMIN') {
      const { title, type, description, scheduledAt, status, location, instructions } = req.body;
      const updated = await prisma.safetyDrill.update({
        where: { id: id as string },
        data: {
          title, type, description,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          status,
          location, instructions,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
        include: { ship: { select: { id: true, name: true } } },
      });
      res.json({ success: true, data: updated });
    } else {
      res.status(403).json({ success: false, message: 'Only admins can update drills' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update drill' });
  }
};

export const deleteDrill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.safetyDrill.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Drill deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Drill not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete drill' });
  }
};

export const markDrillAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const drill = await prisma.safetyDrill.findUnique({ where: { id: id as string } });
    if (!drill) {
      res.status(404).json({ success: false, message: 'Drill not found' });
      return;
    }
    if (drill.status === 'MISSED') {
      res.status(400).json({ success: false, message: 'Cannot attend a missed drill' });
      return;
    }

    const attendance = await prisma.drillAttendance.upsert({
      where: { drillId_userId: { drillId: id as string, userId: req.user!.id } },
      update: { attended: true, notes, submittedAt: new Date() },
      create: {
        drillId: id as string,
        userId: req.user!.id,
        attended: true,
        notes,
        submittedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
};
