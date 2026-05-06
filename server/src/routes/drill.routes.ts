import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as DrillController from '../controllers/drill.controller';

export const drillRouter = Router();
drillRouter.use(authenticate);

drillRouter.get('/', DrillController.getDrills);
drillRouter.get('/:id', DrillController.getDrillById);
drillRouter.post('/', requireAdmin, DrillController.createDrill);
drillRouter.put('/:id', DrillController.updateDrill);
drillRouter.delete('/:id', requireAdmin, DrillController.deleteDrill);
drillRouter.post('/:id/attend', DrillController.markDrillAttendance);
