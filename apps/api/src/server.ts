/**
 * Application Entry Point
 *
 * ARCHITECTURAL DECISION:
 * This is the single entry point for the entire application.
 * It initializes all systems in the correct order:
 * 1. Load environment configuration
 * 2. Connect to database
 * 3. Bootstrap all domain modules
 * 4. Create and configure Express app
 * 5. Start listening for requests
 */

import { bootstrap } from "./bootstrap.js";

async function main(): Promise<void> {
  try {
    const { app, config, shutdown } = await bootstrap();

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${config.env}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await shutdown();
        console.log("All connections closed. Goodbye!");
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
