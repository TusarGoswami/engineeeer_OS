import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, NotFoundError } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { checkDBHealth } from './config/db.js';
import { checkRedisHealth } from './config/redis.js';
import { env } from './config/env.js';

// Import domain routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import academicsRoutes from './modules/academics/academics.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import codingRoutes from './modules/coding/coding.routes.js';
import gateRoutes from './modules/gate/gate.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import assessmentsRoutes from './modules/assessments/assessments.routes.js';
import communityRoutes from './modules/community/community.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';

export const createApp = () => {
  const app = express();

  // Trust proxy for reverse proxies like Nginx
  app.set('trust proxy', 1);

  // Request ID tracing
  app.use(requestIdMiddleware);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed via reverse proxy or standalone
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    })
  );

  // Global rate limiter
  app.use(globalLimiter);

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Liveness check (Process is alive)
  app.get('/healthz', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'engineeros-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Readiness check (Validates database and cache connectivity)
  app.get('/readyz', async (req, res) => {
    const mongoHealthy = checkDBHealth();
    const redisHealthy = await checkRedisHealth();

    const isReady = mongoHealthy && redisHealthy;
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: mongoHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    });
  });

  // Root API metadata
  app.get('/api/v1', (req, res) => {
    res.json({
      message: 'EngineerOS API v1',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/healthz',
        ready: '/readyz',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
      },
    });
  });

  // Domain Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/academics', academicsRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/coding', codingRoutes);
  app.use('/api/v1/gate', gateRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/assessments', assessmentsRoutes);
  app.use('/api/v1/community', communityRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);

  // Route aliases matching legacy/convenience specs
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/academics', academicsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/gate', gateRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/assessments', assessmentsRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/notifications', notificationsRoutes);

  // 404 Catch-All Handler
  app.use((req, res, next) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
