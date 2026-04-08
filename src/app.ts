// src/app.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Factory Method Pattern: `AppFactory` is a factory that
//     creates and configures an Express `Application` object.
//     Callers get the app via `getApp()` — they don't know
//     HOW it was built.
//   - OCP (Open/Closed): To add a new middleware or route group,
//     extend/override setupMiddlewares() or setupRoutes() in a
//     subclass — we don't modify AppFactory directly.
//   - Composition over Inheritance: AppFactory has-an Express
//     `app` rather than inheriting from it.
//   - SRP: Each private method handles ONE concern:
//       setupMiddlewares  → middleware registration
//       setupRoutes       → route mounting
//       setupErrorHandling → error middleware
// ============================================================

import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from './middlewares/errors.middleware.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import recommendationRouter from './routes/recommendations.routes.js';
import healthRouter from './routes/health.routes.js';

// Configuration interface — ISP: only contains what AppFactory needs
interface AppConfig {
  corsOrigin: string;
}

/**
 * AppFactory — Factory that builds and configures the Express app.
 *
 * FACTORY METHOD: `getApp()` returns the fully configured
 * Express Application. The caller (index.ts) does not need
 * to know about cors, cookieParser, or route mounting details.
 *
 * COMPOSITION: We compose the Express app with middleware and routes
 * rather than inheriting from Express.
 */
export class AppFactory {
  // ENCAPSULATION: internal app instance is private
  private readonly app: Application;

  constructor(private readonly config: AppConfig) {
    this.app = express();
    // Call setup methods in required order (Template Method flavour)
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  // -------------------------------------------------------
  // SRP: middleware setup is isolated here
  // -------------------------------------------------------
  private setupMiddlewares(): void {
    // CORS — allow only configured origins
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: '16mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '20kb' }));
    this.app.use(express.static('public'));
    this.app.use(cookieParser());
  }

  // -------------------------------------------------------
  // SRP: route mounting is isolated here
  // OCP: Route imports are added here without touching
  //      middleware or error-handling code.
  // NOTE: JS route files are imported until Person 2-5 convert
  //       their files to TypeScript.
  // -------------------------------------------------------
  private setupRoutes(): void {
    this.app.use('/api/v1/users', userRouter);
    this.app.use('/api/v1/videos', videoRouter);
    this.app.use('/api/v1/subscriptions', subscriptionRouter);
    this.app.use('/api/v1/recommend', recommendationRouter);
    this.app.use('/api/v1/health', healthRouter);
  }

  // -------------------------------------------------------
  // SRP: error handling is isolated here
  // -------------------------------------------------------
  private setupErrorHandling(): void {
    // Global error handler must be registered LAST
    this.app.use(errorHandler);
  }

  /**
   * getApp — Returns the configured Express application.
   * Abstraction: callers get the app without knowing build details.
   */
  getApp(): Application {
    return this.app;
  }
}
