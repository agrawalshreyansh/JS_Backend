// src/utils/asyncHandler.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Strategy Pattern: `asyncHandler` wraps any async request
//     handler function as an interchangeable strategy. The
//     wrapping behaviour (catch + next) is defined once and
//     applied to any handler passed to it.
//   - Adapter Pattern: Adapts an async function (returns Promise)
//     to the synchronous Express middleware signature so Express
//     can call it without knowing about Promises.
//   - SRP: Only responsible for wrapping async handlers to
//     forward errors to the Express error pipeline.
// ============================================================

import { Request, Response, NextFunction } from 'express';

/**
 * AsyncRequestHandler — A strongly typed async Express handler.
 * ISP: Only defines what we actually need (req, res, next → Promise).
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * asyncHandler — Higher-order function (Strategy + Adapter).
 *
 * STRATEGY: Each controller method is a strategy. `asyncHandler`
 * wraps it with unified error-forwarding behaviour so we don't
 * repeat try/catch in every controller.
 *
 * ADAPTER: Converts an `async function` (Promise-based) to a
 * normal Express middleware callback (synchronous signature).
 *
 * @param requestHandler - The async controller method to wrap.
 * @returns  A standard Express `RequestHandler`.
 */
export const asyncHandler = (requestHandler: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Resolve the promise; if it rejects, forward error to Express
    Promise.resolve(requestHandler(req, res, next)).catch(
      (error: Error) => next(error) // Forwards to errors.middleware.ts
    );
  };
};
