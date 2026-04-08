// src/services/DatabaseService.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Singleton Pattern: Only ONE database connection should
//     exist per application. `private constructor` + static
//     `getInstance()` enforces this at the class level.
//   - SRP: Only responsible for managing the Mongoose connection
//     lifecycle (connect / disconnect / getConnection).
//   - Encapsulation: Connection details & instance are private.
//     The outside world only calls connect(), disconnect(),
//     or getConnection().
//   - Abstraction: The caller (index.ts) calls `connect()` and
//     doesn't need to know it's Mongoose under the hood.
// ============================================================

import mongoose from 'mongoose';

/**
 * DatabaseService — Singleton service for MongoDB connectivity.
 *
 * SINGLETON: Guarantees only one Mongoose connection for the
 * entire application lifecycle. No duplicate connections.
 *
 * Abstraction: The rest of the app never calls mongoose.connect()
 * directly — they use this service. If we ever swap ORMs, only
 * this file changes (OCP at the dependency level).
 */
export class DatabaseService {
  // --- Singleton implementation ---
  // Static field holds the single instance (Encapsulation)
  private static instance: DatabaseService;

  // Private constructor prevents `new DatabaseService()` externally
  private constructor() {}

  /**
   * getInstance — Singleton access point.
   *
   * Creates the instance on first call; returns the cached
   * instance on all subsequent calls.
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // -------------------------------------------------------
  // connect — Establishes MongoDB connection
  // Abstraction: caller just awaits `connect()` — they don't
  // know the URI format or Mongoose internals.
  // -------------------------------------------------------
  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URL || '';
      const dbName = process.env.DB_NAME || 'videotube';

      if (!mongoUri) {
        throw new Error('MONGODB_URL is not defined in environment variables');
      }

      const connectionInstance = await mongoose.connect(
        `${mongoUri}/${dbName}`
      );

      console.log(
        `✓ Database connected — Host: ${connectionInstance.connection.host}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Database connection failed: ${message}`);
      throw error; // Re-throw so the server startup fails loudly
    }
  }

  // -------------------------------------------------------
  // disconnect — Graceful teardown
  // -------------------------------------------------------
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✓ Database disconnected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ Database disconnection failed: ${message}`);
      throw error;
    }
  }

  // -------------------------------------------------------
  // getConnection — Returns the raw connection (for advanced use)
  // Encapsulation: returns connection without exposing mongoose
  // -------------------------------------------------------
  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}
