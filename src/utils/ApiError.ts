// src/utils/ApiError.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - SRP: Only models an API error — nothing else.
//   - Encapsulation: Bundles statusCode, message, success,
//     errors into one coherent object; callers don't build
//     error shapes by hand anymore.
//   - LSP: Extends Error correctly — `instanceof ApiError`
//     and `instanceof Error` both work as expected.
// ============================================================

/**
 * ApiError — Standard typed error for HTTP API responses.
 *
 * Encapsulation: All error information is contained here.
 * The error middleware & BaseController simply receive an
 * ApiError and read its properties — no guessing involved.
 *
 * LSP: Using `Object.setPrototypeOf` ensures the prototype
 * chain is correct after TypeScript transpilation.
 */
export class ApiError extends Error {
  // Public fields so middleware can read them (Encapsulation)
  public readonly statusCode: number;
  public readonly data: null;
  public readonly success: boolean;
  public readonly errors: unknown[];

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: unknown[] = [],
    stack: string = ''
  ) {
    super(message); // Call Error constructor (Abstraction layer below us)

    this.statusCode = statusCode;
    this.data = null;       // API errors carry no payload data
    this.message = message;
    this.success = false;   // Errors are never successful
    this.errors = errors;

    // Fix prototype chain for instanceof checks (LSP)
    Object.setPrototypeOf(this, ApiError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
