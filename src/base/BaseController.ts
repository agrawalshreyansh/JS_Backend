// src/base/BaseController.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Template Method Pattern: `handleError` and `sendSuccess`
//     define skeleton algorithms that subclasses rely on.
//   - Abstraction: Hides low-level HTTP response construction.
//   - SRP (Single Responsibility): Only responsible for HTTP
//     response formatting — nothing else.
// ============================================================

import { Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * BaseController — Abstract base class for all controllers.
 *
 * ABSTRACTION: Exposes only what external code needs (handleError,
 * sendSuccess). Internal HTTP formatting is hidden.
 *
 * TEMPLATE METHOD: Defines reusable response-handling steps so
 * every concrete controller follows the same pattern.
 */
export abstract class BaseController {
  // -------------------------------------------------------
  // Template Method: handleError
  // Centralises all error → HTTP response translation.
  // Concrete controllers call this instead of duplicating logic.
  // -------------------------------------------------------
  protected handleError(error: unknown, res: Response): void {
    // Narrow the type explicitly before accessing properties
    if (error instanceof ApiError) {
      // ApiError carries its own statusCode (SRP: ApiError knows its shape)
      res.status(error.statusCode).json({
        statusCode: error.statusCode,
        data: error.data,
        message: error.message,
        success: error.success,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: error.message,
        success: false,
      });
    } else {
      res.status(500).json({
        statusCode: 500,
        data: null,
        message: 'Unknown error occurred',
        success: false,
      });
    }
  }

  // -------------------------------------------------------
  // Template Method: sendSuccess
  // Uniform success response so all controllers look identical.
  // -------------------------------------------------------
  protected sendSuccess(
    res: Response,
    statusCode: number,
    data: unknown,
    message: string = 'Success'
  ): void {
    res.status(statusCode).json({
      statusCode,
      data,
      message,
      success: true,
    });
  }
}
