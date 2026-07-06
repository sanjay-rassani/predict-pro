import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './auth/routes.js';
import matchRoutes from './matches/routes.js';
import predictionRoutes from './predictions/routes.js';
import newsRoutes from './news/routes.js';
import adminRoutes from './admin/routes.js';
import analyticsRoutes from './analytics/routes.js';
import notificationRoutes from './notifications/routes.js';
import pool from './db/pool.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(requestLogger());

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'disconnected' });
    }
  });

  app.use('/auth', authRoutes);
  app.use('/matches', matchRoutes);
  app.use('/predictions', predictionRoutes);
  app.use('/news', newsRoutes);
  app.use('/admin', adminRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/notifications', notificationRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}
