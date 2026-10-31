import { Router } from 'express';
import { UserController } from './user.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { avatarUpload } from '../../middleware/upload.js';
import { updateProfileSchema } from './user.schema.js';

const router = Router();

// Public route to serve cached immutable avatars
router.get('/avatar/:key', UserController.getAvatar);

// Authenticated user routes
router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), UserController.updateMe);
router.post('/me/avatar', avatarUpload.single('avatar'), UserController.uploadAvatar);
router.delete('/me/avatar', UserController.deleteAvatar);
router.get('/me/export', UserController.exportMe);
router.delete('/me', UserController.deleteMe);

export default router;
