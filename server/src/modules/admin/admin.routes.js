import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createProblemSchema,
  updateProblemSchema,
  createTestCaseSchema,
  createAssessmentSchema,
  updateAssessmentSchema,
  integrityVerdictSchema,
  updateUserRoleSchema,
  verifyAlumniSchema,
} from './admin.schema.js';

const router = Router();

// Protect ALL admin routes: require authentication and role contentAdmin or platformAdmin
router.use(requireAuth);
router.use(requireRole('contentAdmin', 'platformAdmin'));

// Platform Analytics
router.get('/stats', AdminController.getStats);

// Problem Authoring
router.get('/problems', AdminController.getProblems);
router.get('/problems/:id', AdminController.getProblemById);
router.post('/problems', validate({ body: createProblemSchema }), AdminController.createProblem);
router.put('/problems/:id', validate({ body: updateProblemSchema }), AdminController.updateProblem);
router.delete('/problems/:id', AdminController.deleteProblem);
router.post('/problems/:id/testcases', validate({ body: createTestCaseSchema }), AdminController.addTestCase);
router.delete('/problems/:id/testcases/:testCaseId', AdminController.deleteTestCase);

// Assessment Creator & Scheduler
router.get('/assessments', AdminController.getAssessments);
router.post('/assessments', validate({ body: createAssessmentSchema }), AdminController.createAssessment);
router.put('/assessments/:id', validate({ body: updateAssessmentSchema }), AdminController.updateAssessment);
router.delete('/assessments/:id', AdminController.deleteAssessment);

// Student Integrity Moderation Queue
router.get('/integrity-signals', AdminController.getIntegritySignals);
router.post('/attempts/:attemptId/verdict', validate({ body: integrityVerdictSchema }), AdminController.resolveIntegrityVerdict);

// User & Alumni Governance (restricted to platformAdmin to prevent privilege escalation)
router.get('/users', requireRole('platformAdmin'), AdminController.getUsers);
router.patch('/users/:userId/role', requireRole('platformAdmin'), validate({ body: updateUserRoleSchema }), AdminController.updateUserRole);
router.post('/users/:userId/alumni-status', requireRole('platformAdmin'), validate({ body: verifyAlumniSchema }), AdminController.verifyAlumniStatus);

export default router;
