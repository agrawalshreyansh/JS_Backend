// src/constants.ts
// ============================================================
// Simple typed constants — previously constants.js
// No patterns specifically, but using TypeScript `const`
// assertions ensures these are immutable at compile time.
// ============================================================

/**
 * DB_NAME — The MongoDB database name for the application.
 * Typed as a literal string so TypeScript infers 'videotube'
 * exactly, not just `string`.
 */
export const DB_NAME = 'videotube' as const;
