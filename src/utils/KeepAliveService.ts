// src/utils/KeepAliveService.ts
// ============================================================
// DESIGN PATTERNS APPLIED:
//   - Singleton Pattern: Only ONE KeepAliveService should run
//     per server instance. The static `getInstance()` ensures
//     that only a single cron job is ever scheduled.
//   - SRP: Only responsible for periodically pinging the health
//     endpoint to prevent the server from sleeping on free tiers.
//   - Encapsulation: `job` and `serverUrl` are private — callers
//     only call `start()` and `stop()`.
// ============================================================

import cron, { ScheduledTask } from 'node-cron';

/**
 * KeepAliveService — Singleton service that pings the health
 * endpoint every 10 minutes to prevent Render/Railway free-tier
 * instances from sleeping.
 *
 * SINGLETON: `private constructor` + static `instance` field
 * guarantee only one instance and one cron job ever run.
 *
 * Encapsulation: internals (job handle, URL) are hidden.
 */
export class KeepAliveService {
  // --- Singleton implementation ---
  private static instance: KeepAliveService | null = null;

  // Internal state — ENCAPSULATION (private)
  private job: ScheduledTask | null = null;
  private readonly serverUrl: string;

  // Private constructor prevents external `new KeepAliveService()`
  private constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Factory method acting as the Singleton access point.
   * First call creates the instance; subsequent calls return it.
   *
   * SINGLETON + Factory Method: Controls instantiation.
   */
  static getInstance(serverUrl: string): KeepAliveService {
    if (!KeepAliveService.instance) {
      KeepAliveService.instance = new KeepAliveService(serverUrl);
    }
    return KeepAliveService.instance;
  }

  /**
   * start — Schedules the ping cron job.
   * Abstraction: callers just call `start()` — they don't know
   * about cron syntax or fetch internals.
   */
  start(): void {
    if (this.job) {
      console.log('KeepAliveService is already running.');
      return;
    }

    // Schedule ping every 10 minutes
    this.job = cron.schedule('*/10 * * * *', async () => {
      await this.ping();
    });

    console.log(
      '🕐 Keep-alive cron job started — Server will be pinged every 10 minutes'
    );
  }

  /**
   * stop — Destroys the cron job gracefully.
   * Encapsulation: job management is internal; callers just stop.
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      console.log('🛑 Keep-alive cron job stopped');
    }
  }

  // -------------------------------------------------------
  // Private helper — performs the actual HTTP ping
  // Encapsulation: hidden from outside world
  // -------------------------------------------------------
  private async ping(): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      console.log(`[${timestamp}] Keep-alive ping initiated...`);

      const response = await fetch(`${this.serverUrl}/api/v1/health`);
      const data = (await response.json()) as { data?: { status?: string } };

      if (response.ok) {
        console.log(
          `[${timestamp}] ✓ Server is awake — Status: ${data?.data?.status}`
        );
      } else {
        console.log(
          `[${timestamp}] ✗ Server responded with status: ${response.status}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${timestamp}] ✗ Keep-alive ping failed: ${message}`);
    }
  }
}
