import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as ShipController from '../controllers/ship.controller';

export const shipRouter = Router();
shipRouter.use(authenticate);

shipRouter.get('/', ShipController.getAllShips);
shipRouter.get('/:id', ShipController.getShipById);
shipRouter.post('/', requireAdmin, ShipController.createShip);
shipRouter.put('/:id', requireAdmin, ShipController.updateShip);
shipRouter.delete('/:id', requireAdmin, ShipController.deleteShip);
