/**
 * Express Application Factory
 *
 * ARCHITECTURAL DECISION:
 * The Express app is created via a factory function that receives
 * all domain routers. This keeps the app configuration separate
 * from the domain logic and makes testing easier.
 *
 * The app handles:
 * - Global middleware (security, parsing, logging)
 * - Route mounting
 * - Global error handling
 */

import express, { type Application, type Request, type Response, type NextFunction, type Router } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

export interface AppConfig {
  routers: Record<string, Router>;
}

/**
 * Creates and configures the Express application.
 */
export function createApp(config: AppConfig): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Performance middleware
  app.use(compression());

  // Request parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging (simple version - replace with pino/winston in production)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // Mount domain routers
  // Each domain's routes are namespaced under their prefix
  for (const [prefix, router] of Object.entries(config.routers)) {
    app.use(prefix, router);
  }

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource not found",
      },
    });
  });

  // Global error handler
  app.use(globalErrorHandler);

  return app;
}

/**
 * Global error handler for unhandled errors.
 */
function globalErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", error);

  // Don't leak error details in production
  const isDev = process.env['NODE_ENV'] !== "production";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isDev ? error.message : "An unexpected error occurred",
      ...(isDev && { stack: error.stack }),
    },
  });
}
