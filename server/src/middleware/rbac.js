import { ForbiddenError, UnauthorizedError } from './error.js';

export const ROLES = {
  STUDENT: 'student',
  SENIOR: 'senior',
  CONTENT_ADMIN: 'contentAdmin',
  PLATFORM_ADMIN: 'platformAdmin',
};

// Permission capabilities matrix
export const PERMISSIONS = {
  'academics:read': [ROLES.STUDENT, ROLES.SENIOR, ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'academics:write': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'coding:submit': [ROLES.STUDENT, ROLES.SENIOR, ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'coding:manage': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'gate:attempt': [ROLES.STUDENT, ROLES.SENIOR, ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'gate:manage': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'assessments:attempt': [ROLES.STUDENT, ROLES.SENIOR],
  'assessments:manage': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'assessments:review': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'community:post': [ROLES.STUDENT, ROLES.SENIOR, ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'community:moderate': [ROLES.CONTENT_ADMIN, ROLES.PLATFORM_ADMIN],
  'admin:access': [ROLES.PLATFORM_ADMIN],
};

/**
 * Enforce minimum or matching roles
 * @param  {...string} allowedRoles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === ROLES.PLATFORM_ADMIN) {
      return next();
    }

    return next(
      new ForbiddenError(`Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`)
    );
  };
};

/**
 * Enforce explicit permission
 * @param {string} permission
 */
export const requirePermission = permission => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const authorizedRoles = PERMISSIONS[permission] || [];
    if (authorizedRoles.includes(req.user.role) || req.user.role === ROLES.PLATFORM_ADMIN) {
      return next();
    }

    return next(new ForbiddenError(`Forbidden: Missing permission [${permission}]`));
  };
};

/**
 * Enforce resource ownership
 * @param {string} paramKey - Key in req.params containing owner userId
 */
export const requireOwnership = (paramKey = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const targetUserId = req.params[paramKey] || req.body[paramKey];
    if (req.user.id === targetUserId || req.user.role === ROLES.PLATFORM_ADMIN) {
      return next();
    }

    return next(new ForbiddenError('Forbidden: You can only access your own resources'));
  };
};

export default { ROLES, PERMISSIONS, requireRole, requirePermission, requireOwnership };
