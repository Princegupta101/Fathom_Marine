import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { shipRouter } from './routes/ship.routes';
import { maintenanceRouter } from './routes/maintenance.routes';
import { drillRouter } from './routes/drill.routes';
import { complianceRouter } from './routes/compliance.routes';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Fathom Marine API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/ships', shipRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/drills', drillRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/users', userRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚢 Fathom Marine API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
