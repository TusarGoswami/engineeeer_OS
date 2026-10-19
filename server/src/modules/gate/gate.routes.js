import { Router } from 'express';
import { GateController } from './gate.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Test discovery and retrieval
router.get('/tests', requireAuth, GateController.getTests);
router.get('/tests/:id', requireAuth, GateController.getTestForAttempt);
router.post('/tests/:id/submit', requireAuth, GateController.submitAttempt);

// Student attempts
router.get('/attempts', requireAuth, GateController.getUserAttempts);
router.get('/attempts/:id', requireAuth, GateController.getAttemptById);

export default router;
