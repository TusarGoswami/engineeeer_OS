import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateTaskSchema, getHeatmapQuerySchema } from './dashboard.schema.js';

const router = Router();

// Dashboard summary requires authentication
router.get('/summary', requireAuth, DashboardController.getSummary);

// "What Should I Do Today?" Action Tasks
router.get('/today', requireAuth, DashboardController.getToday);
router.patch(
  '/tasks/:id',
  requireAuth,
  validate({ body: updateTaskSchema }),
  DashboardController.updateTask
);

// 12-month consistency heatmap telemetry
router.get(
  '/heatmap',
  requireAuth,
  validate({ query: getHeatmapQuerySchema }),
  DashboardController.getHeatmap
);

export default router;
