import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from './auth.schema.js';

const router = Router();

// Apply auth rate limiter
router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/refresh', authLimiter, AuthController.refresh);
router.post('/logout', AuthController.logout);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: passwordResetRequestSchema }),
  AuthController.requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: passwordResetConfirmSchema }),
  AuthController.confirmPasswordReset
);

export default router;
