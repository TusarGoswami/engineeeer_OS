import { Router } from 'express';
import { CodingController } from './coding.controller.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { codeExecLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// Problem Catalogue
router.get('/problems', optionalAuth, CodingController.getProblems);
router.get('/problems/:slug', optionalAuth, CodingController.getProblemBySlug);

// Run code against samples (immediate feedback)
router.post('/problems/:id/run', requireAuth, codeExecLimiter, CodingController.runSampleTest);
router.post('/problems/:id/submit', requireAuth, codeExecLimiter, CodingController.submitSolution);

// Full submission (Queued execution returning 202 Accepted)
router.post('/submissions', requireAuth, codeExecLimiter, CodingController.submitSolution);
router.get('/submissions', requireAuth, CodingController.getMySubmissions);
router.get('/submissions/me', requireAuth, CodingController.getMySubmissions);
router.get('/submissions/:id', requireAuth, CodingController.getSubmissionById);

export default router;
