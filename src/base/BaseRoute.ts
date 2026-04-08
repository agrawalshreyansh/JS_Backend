// src/base/BaseRoute.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Template Method Pattern: `setupRoutes()` is an abstract
//     hook that every concrete route class must implement.
//     The constructor calls it automatically — the "template".
//   - OCP (Open/Closed): BaseRoute is closed for modification.
//     New route files simply extend it and implement the hook.
//   - SRP: Only responsible for Router creation and the
//     routing setup contract — nothing else.
// ============================================================

import { Router } from 'express';

/**
 * BaseRoute — Abstract base class for all route files.
 *
 * TEMPLATE METHOD: The constructor calls `this.setupRoutes()`.
 * Each concrete subclass defines its own `setupRoutes()` body.
 * This ensures routes are always registered at construction time.
 *
 * OCP: We never change BaseRoute when adding new endpoints.
 * Instead we create a new class that extends BaseRoute.
 */
export abstract class BaseRoute {
  // ENCAPSULATION: router is public (used by app.ts to mount it),
  // but route setup logic is hidden inside each concrete class.
  public readonly router: Router;

  constructor() {
    this.router = Router();
    // Template Method — hook called on construction
    this.setupRoutes();
  }

  /**
   * Abstract hook — every subclass must implement this.
   * Define all `this.router.get/post/put/delete(...)` calls here.
   */
  abstract setupRoutes(): void;

  /**
   * Getter — alternative way to retrieve the configured router.
   * Abstraction: callers just call getRouter(), unaware of internals.
   */
  protected getRouter(): Router {
    return this.router;
  }
}
