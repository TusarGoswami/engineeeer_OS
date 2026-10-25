import { Router } from 'express';
import { CommunityController } from './community.controller.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Post discovery and retrieval
router.get('/', optionalAuth, CommunityController.getPosts);
router.post('/', requireAuth, CommunityController.createPost);
router.get('/:id', optionalAuth, CommunityController.getPostById);

// Replies & Upvotes
router.post('/:id/replies', requireAuth, CommunityController.addReply);
router.post('/:id/upvote', requireAuth, CommunityController.upvotePost);
router.post('/replies/:replyId/upvote', requireAuth, CommunityController.upvoteReply);
router.post('/:id/replies/:replyId/accept', requireAuth, CommunityController.acceptReply);

export default router;
