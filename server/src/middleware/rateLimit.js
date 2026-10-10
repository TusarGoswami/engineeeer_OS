import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import { env } from '../config/env.js';

const createRateLimiter = (options = {}) => {
  const { windowMs = 60 * 1000, max = 120, prefix = 'rl:global:', keyGenerator } = options;

  if (env.NODE_ENV === 'test') {
    // In test environment, skip rate limiting to avoid throttling test runners
    return (req, res, next) => next();
  }

  let store = undefined;

  // Use Redis store in production/development if real Redis is active
  if (env.NODE_ENV !== 'test') {
    try {
      const client = getRedisClient();
      store = new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix,
      });
    } catch {
      // Memory store fallback
    }
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: keyGenerator || (req => req.ip || req.headers['x-forwarded-for'] || 'unknown'),
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please slow down and try again later.',
          details: { retryAfterSeconds: Math.ceil(windowMs / 1000) },
          requestId: req.id,
        },
      });
    },
  });
};

export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_GLOBAL_MAX,
  prefix: 'rl:global:',
});

export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_AUTH_MAX,
  prefix: 'rl:auth:',
});

export const codeExecLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_CODE_EXEC_MAX,
  prefix: 'rl:code:',
  keyGenerator: req => req.user?.id || req.ip || 'anonymous',
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.RATE_LIMIT_AI_MAX,
  prefix: 'rl:ai:',
  keyGenerator: req => req.user?.id || req.ip || 'anonymous',
});

export default { globalLimiter, authLimiter, codeExecLimiter, aiLimiter };
