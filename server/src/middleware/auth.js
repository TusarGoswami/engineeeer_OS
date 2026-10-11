import { TokenService } from '../modules/auth/token.service.js';
import { UnauthorizedError } from './error.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = TokenService.verifyAccessToken(token);
    decoded._id = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = TokenService.verifyAccessToken(token);
    decoded._id = decoded.id;
    req.user = decoded;
  } catch {
    // Silently continue for optional auth
  }
  next();
};

export default { requireAuth, optionalAuth };
