// src/base/BaseError.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - SRP (Single Responsibility): This class exists only to
//     represent a structured application error — no business
//     logic, no side effects.
//   - Encapsulation: All properties are `readonly`; callers
//     cannot mutate them after construction.
//   - LSP (Liskov Substitution): Extends built-in `Error`
//     correctly (sets prototype chain) so `instanceof` checks
//     behave as expected throughout the codebase.
// ============================================================

/**
 * BaseError — Enhanced base error class for the application.
 *
 * LSP: By calling `Object.setPrototypeOf` we ensure that
 * `instanceof BaseError` works correctly even after TypeScript
 * transpiles to ES5 (a common Node.js gotcha).
 *
 * Encapsulation: Properties are `readonly` so nothing outside
 * can accidentally change an error's statusCode after creation.
 */
export class BaseError extends Error {
  // All fields public for easy serialisation, but readonly for safety
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errors: unknown[];
  public readonly data: unknown;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: unknown[] = [],
    data: unknown = null,
    stack?: string
  ) {
    // Call the parent Error constructor (Abstraction: builts on Error)
    super(message);

    // Assign our custom fields (Encapsulation)
    this.statusCode = statusCode;
    this.message = message;
    this.success = false; // Errors are never "successful"
    this.errors = errors;
    this.data = data;

    // Fix the prototype chain (LSP fix for TypeScript + ES5 transpile)
    Object.setPrototypeOf(this, BaseError.prototype);

    // Capture a clean stack trace if none was provided
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
