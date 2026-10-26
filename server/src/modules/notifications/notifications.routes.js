import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, NotificationsController.getNotifications);
router.patch('/read-all', requireAuth, NotificationsController.markAllAsRead);
router.patch('/:id/read', requireAuth, NotificationsController.markAsRead);

export default router;
