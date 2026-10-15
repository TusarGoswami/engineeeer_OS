import { Router } from 'express';
import { AcademicsController } from './academics.controller.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

// Public / Authenticated read routes
router.get('/subjects', optionalAuth, AcademicsController.getSubjects);
router.get('/subjects/:id', optionalAuth, AcademicsController.getSubjectById);
router.get('/subjects/:id/resources', optionalAuth, AcademicsController.getResources);

// Student topic progress toggle
router.post(
  '/subjects/:id/topics/:topicId/toggle',
  requireAuth,
  AcademicsController.toggleTopicCompletion
);

// Content Admin CRUD routes
router.post(
  '/subjects',
  requireAuth,
  requireRole('contentAdmin', 'platformAdmin'),
  AcademicsController.createSubject
);
router.patch(
  '/subjects/:id',
  requireAuth,
  requireRole('contentAdmin', 'platformAdmin'),
  AcademicsController.updateSubject
);
router.post(
  '/subjects/:id/resources',
  requireAuth,
  requireRole('contentAdmin', 'platformAdmin'),
  AcademicsController.createResource
);

export default router;
