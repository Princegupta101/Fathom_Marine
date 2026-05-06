import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as ComplianceController from '../controllers/compliance.controller';

export const complianceRouter = Router();
complianceRouter.use(authenticate);

complianceRouter.get('/dashboard', ComplianceController.getComplianceDashboard);
complianceRouter.get('/ship/:shipId', ComplianceController.getShipCompliance);
