import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllShips = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ships = await prisma.ship.findMany({
      include: {
        _count: { select: { users: true, maintenanceTasks: true, safetyDrills: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: ships });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ships' });
  }
};

export const getShipById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ship = await prisma.ship.findUnique({
      where: { id: id as string },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { maintenanceTasks: true, safetyDrills: true } },
      },
    });
    if (!ship) {
      res.status(404).json({ success: false, message: 'Ship not found' });
      return;
    }
    res.json({ success: true, data: ship });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ship' });
  }
};

export const createShip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, imoNumber, type, flag, builtYear, grossTonnage } = req.body;
    if (!name || !imoNumber || !type || !flag || !builtYear || !grossTonnage) {
      res.status(400).json({ success: false, message: 'All ship fields are required' });
      return;
    }
    const ship = await prisma.ship.create({
      data: { name, imoNumber, type, flag, builtYear: Number(builtYear), grossTonnage: Number(grossTonnage) },
    });
    res.status(201).json({ success: true, data: ship });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'IMO number already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create ship' });
  }
};

export const updateShip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, imoNumber, type, flag, builtYear, grossTonnage } = req.body;
    const ship = await prisma.ship.update({
      where: { id: id as string },
      data: { name, imoNumber, type, flag, builtYear: Number(builtYear), grossTonnage: Number(grossTonnage) },
    });
    res.json({ success: true, data: ship });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Ship not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update ship' });
  }
};

export const deleteShip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.ship.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Ship deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Ship not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete ship' });
  }
};
