import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as UserController from '../controllers/user.controller';

export const userRouter = Router();
userRouter.use(authenticate);

userRouter.get('/', requireAdmin, UserController.getAllUsers);
userRouter.get('/crew', requireAdmin, UserController.getCrewMembers);
userRouter.get('/:id', UserController.getUserById);
userRouter.put('/:id', UserController.updateUser);
userRouter.delete('/:id', requireAdmin, UserController.deleteUser);
