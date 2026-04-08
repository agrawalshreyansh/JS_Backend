// src/middlewares/errors.middleware.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - SRP: Only handles converting errors into HTTP responses.
//   - Observer Pattern (loose): Express error middleware acts
//     like a subscriber to error events emitted by routes/
//     controllers via `next(error)`.
//   - Strategy Pattern: Chooses response strategy based on
//     error type (ApiError vs generic Error).
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * errorHandler — Global Express error-handling middleware.
 *
 * OBSERVER: Registered as the last middleware; Express
 * automatically routes any `next(error)` calls here.
 *
 * STRATEGY: Checks if error is ApiError (custom) or generic
 * Error, and picks the appropriate response structure.
 */
const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Determine status code — ApiError carries its own, others default to 500
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof ApiError ? err.errors : [];

  // Only expose stack trace in development (security: Encapsulation)
  const stack =
    process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack,
  });
};

export default errorHandler;
