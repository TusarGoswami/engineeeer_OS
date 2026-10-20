import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Dashboard summary requires authentication
router.get('/summary', requireAuth, DashboardController.getSummary);

export default router;
