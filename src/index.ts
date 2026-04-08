// src/index.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - DIP (Dependency Inversion Principle): `startServer` uses
//     `DatabaseService` and `AppFactory` abstractions — it does
//     NOT depend on mongoose or express directly.
//   - Singleton: `DatabaseService.getInstance()` ensures one
//     connection is ever created.
//   - Factory: `new AppFactory(config)` and `.getApp()` create
//     the Express app via the factory.
//   - SRP: `startServer()` only orchestrates startup steps;
//     each concern is delegated to specialist classes.
// ============================================================

import dotenv from 'dotenv';
import { DatabaseService } from './services/DatabaseService.js';
import { AppFactory } from './app.js';
import { KeepAliveService } from './utils/KeepAliveService.js';

// Load environment variables first (before any other code runs)
dotenv.config({ path: '.env' });

// Read typed config from environment
const PORT: number = parseInt(process.env.PORT || '8000', 10);
const CORS_ORIGIN: string = process.env.CORS_ORIGIN || '*';
const SERVER_URL: string =
  process.env.SERVER_URL || `http://localhost:${PORT}`;

/**
 * startServer — Orchestrates the full application startup sequence.
 *
 * DIP: Calls abstractions (DatabaseService, AppFactory,
 * KeepAliveService) instead of concrete implementations.
 * If we swap MongoDB for PostgreSQL, only DatabaseService changes.
 *
 * SRP: startServer's only job is sequencing — not configuring
 * middleware or setting up routes.
 */
async function startServer(): Promise<void> {
  try {
    // STEP 1: Connect to database (Singleton ensures one connection)
    const dbService = DatabaseService.getInstance();
    await dbService.connect();

    // STEP 2: Build the Express app (Factory Method)
    const appFactory = new AppFactory({ corsOrigin: CORS_ORIGIN });
    const app = appFactory.getApp();

    // STEP 3: Start listening for requests
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);

      // STEP 4: Start keep-alive pings (Singleton)
      // Abstraction: we just call start() — cron internals are hidden
      const keepAlive = KeepAliveService.getInstance(SERVER_URL);
      keepAlive.start();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to start server: ${message}`);
    process.exit(1); // Non-zero exit tells process managers to restart
  }
}

// Bootstrap the application
startServer();
