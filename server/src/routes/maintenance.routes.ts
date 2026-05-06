import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as MaintenanceController from '../controllers/maintenance.controller';

export const maintenanceRouter = Router();
maintenanceRouter.use(authenticate);

maintenanceRouter.get('/', MaintenanceController.getTasks);
maintenanceRouter.get('/:id', MaintenanceController.getTaskById);
maintenanceRouter.post('/', requireAdmin, MaintenanceController.createTask);
maintenanceRouter.put('/:id', MaintenanceController.updateTask);
maintenanceRouter.delete('/:id', requireAdmin, MaintenanceController.deleteTask);
maintenanceRouter.post('/:id/comments', MaintenanceController.addTaskComment);
