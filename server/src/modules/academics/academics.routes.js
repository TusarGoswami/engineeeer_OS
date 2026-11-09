import { Router } from 'express';
import { AcademicsController } from './academics.controller.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { resourceUpload } from '../../middleware/upload.js';

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
router.post(
  '/subjects/:id/resources/upload',
  requireAuth,
  requireRole('contentAdmin', 'platformAdmin', 'senior'),
  resourceUpload.single('file'),
  AcademicsController.uploadResource
);

export default router;
