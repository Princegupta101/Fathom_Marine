import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, shipId: true, createdAt: true, ship: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getCrewMembers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const crew = await prisma.user.findMany({
      where: { role: 'CREW' },
      select: { id: true, name: true, email: true, shipId: true, ship: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: crew });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch crew' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true,
        ship: { select: { id: true, name: true } },
        assignedTasks: {
          select: { id: true, title: true, status: true, dueDate: true },
          take: 5,
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const updateData: any = {};

    if (req.user!.role === 'ADMIN') {
      const { name, email, role, shipId } = req.body;
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      updateData.shipId = shipId || null;
    } else {
      if (req.body.name) updateData.name = req.body.name;
    }

    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, shipId: true, updatedAt: true },
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
