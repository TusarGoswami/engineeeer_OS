import { Router } from 'express';
import { AiController } from './ai.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// AI Academic Assistant
router.post('/assistant/stream', requireAuth, aiLimiter, AiController.streamAssistant);
router.get('/assistant/conversations', requireAuth, AiController.getAssistantConversations);
router.get('/assistant/conversations/:id', requireAuth, AiController.getAssistantConversationById);

// AI Mock Interviews
router.post('/interviews', requireAuth, aiLimiter, AiController.createInterview);
router.get('/interviews', requireAuth, AiController.getUserInterviews);
router.get('/interviews/:id', requireAuth, AiController.getInterviewById);
router.post('/interviews/:id/turn', requireAuth, aiLimiter, AiController.submitInterviewTurn);
router.post('/interviews/:id/finish', requireAuth, AiController.finishInterview);

export default router;
