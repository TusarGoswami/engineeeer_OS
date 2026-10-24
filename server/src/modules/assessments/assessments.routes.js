import { Router } from 'express';
import { AssessmentsController } from './assessments.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

// Student routes
router.get('/', requireAuth, AssessmentsController.getAssessments);
router.get('/:id', requireAuth, AssessmentsController.getAssessmentById);
router.post('/:id/start', requireAuth, AssessmentsController.startAttempt);
router.post('/attempts/:attemptId/autosave', requireAuth, AssessmentsController.autosave);
router.post('/attempts/:attemptId/integrity', requireAuth, AssessmentsController.recordIntegrity);
router.post('/attempts/:attemptId/submit', requireAuth, AssessmentsController.submitAttempt);

// Faculty & Reviewer Dashboard routes
router.get(
  '/:id/review-signals',
  requireAuth,
  requireRole('contentAdmin', 'platformAdmin'),
  AssessmentsController.getReviewSignals
);

export default router;
