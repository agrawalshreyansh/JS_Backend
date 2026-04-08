// src/utils/ApiResponse.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - SRP: Only models a successful API response — nothing else.
//   - Encapsulation: Wraps statusCode, data, message, success
//     into one always-consistent shape.
//   - ISP (Interface Segregation): Separate `ApiResponseData`
//     interface so callers can depend on just the shape without
//     needing the full class (useful for tests & type checks).
// ============================================================

/**
 * ApiResponseData — Interface describing the JSON shape.
 *
 * ISP: Code that only needs to READ a response (e.g. tests,
 * client SDK types) can depend on this interface alone —
 * not the full ApiResponse class.
 */
export interface ApiResponseData {
  statusCode: number;
  data: unknown;
  message: string;
  success: boolean;
}

/**
 * ApiResponse — Standard typed wrapper for successful responses.
 *
 * Encapsulation: Automatically computes `success` from statusCode.
 * Controllers never calculate `success` themselves — they just
 * pass `statusCode` and the class handles the rest.
 *
 * SRP: This class only builds response objects.
 */
export class ApiResponse implements ApiResponseData {
  public readonly statusCode: number;
  public readonly data: unknown;
  public readonly message: string;
  public readonly success: boolean;

  constructor(statusCode: number, data: unknown, message: string = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Encapsulation: success is derived, not manually set
    this.success = statusCode < 400;
  }
}
