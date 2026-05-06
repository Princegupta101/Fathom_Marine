import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shipId, status, priority, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (req.user!.role === 'CREW') {
      where.assignedToId = req.user!.id;
    }

    if (shipId) where.shipId = shipId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    await prisma.maintenanceTask.updateMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
        isOverdue: false,
      },
      data: { isOverdue: true },
    });

    const [tasks, total] = await Promise.all([
      prisma.maintenanceTask.findMany({
        where,
        include: {
          ship: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isOverdue: 'desc' }, { dueDate: 'asc' }],
        skip,
        take: Number(limit),
      }),
      prisma.maintenanceTask.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance tasks' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await prisma.maintenanceTask.findUnique({
      where: { id: id as string },
      include: {
        ship: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, shipId, assignedToId, dueDate, priority } = req.body;
    if (!title || !description || !shipId || !dueDate) {
      res.status(400).json({ success: false, message: 'title, description, shipId, and dueDate are required' });
      return;
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        title,
        description,
        shipId,
        assignedToId: assignedToId || null,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        createdById: req.user!.id,
      },
      include: {
        ship: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await prisma.maintenanceTask.findUnique({ where: { id: id as string } });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    if (req.user!.role === 'CREW' && task.assignedToId !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      return;
    }

    let updateData: any = {};

    if (req.user!.role === 'ADMIN') {
      const { title, description, shipId, assignedToId, dueDate, priority, status } = req.body;
      updateData = { title, description, shipId, assignedToId, priority, status };
      if (dueDate) updateData.dueDate = new Date(dueDate);
    } else {
      updateData.status = req.body.status;
    }

    if (updateData.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.isOverdue = false;
    }

    const updated = await prisma.maintenanceTask.update({
      where: { id: id as string },
      data: updateData,
      include: {
        ship: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.maintenanceTask.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

export const addTaskComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }
    const comment = await prisma.taskComment.create({
      data: { content, taskId: id as string, userId: req.user!.id },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};
