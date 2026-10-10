import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests, please try again later.',
    code = 'RATE_LIMIT_EXCEEDED'
  ) {
    super(message, 429, code);
  }
}

// Global Express Error Middleware
export const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || 'req_unknown';

  // Format Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));

    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: formattedErrors,
        requestId,
      },
    });
  }

  // Handle Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: `An entity with this ${field} already exists.`,
        details: { field },
        requestId,
      },
    });
  }

  // Handle custom AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, `[AppError ${err.statusCode}] ${err.message}`);
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Unhandled internal server errors
  logger.error({ err, requestId }, `[UnhandledError] ${err.message}`);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected server error occurred.'
          : err.message,
      requestId,
    },
  });
};

export default errorHandler;
