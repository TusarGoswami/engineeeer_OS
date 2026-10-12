import { Router } from 'express';
import { UserController } from './user.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema } from './user.schema.js';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/me', UserController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), UserController.updateMe);
router.get('/me/export', UserController.exportMe);
router.delete('/me', UserController.deleteMe);

export default router;
