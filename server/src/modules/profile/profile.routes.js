import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSettingsSchema, publicProfileQuerySchema } from './profile.schema.js';

const router = Router();

// Authenticated owner routes
router.get('/me', requireAuth, ProfileController.getMe);
router.patch('/me', requireAuth, validate({ body: updateProfileSettingsSchema }), ProfileController.updateMe);
router.post('/me/regenerate-share-token', requireAuth, ProfileController.regenerateShareToken);
router.get('/me/badges', requireAuth, ProfileController.getBadges);
router.get('/me/heatmap', requireAuth, ProfileController.getHeatmap);

// Public card & profile route (supports unlisted share tokens)
router.get(
  '/:username',
  validate({ query: publicProfileQuerySchema }),
  ProfileController.getPublicProfile
);

export default router;

