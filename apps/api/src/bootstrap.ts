/**
 * Application Bootstrap
 *
 * ARCHITECTURAL DECISION:
 * This is the composition root where all dependencies are wired together.
 * Key principles:
 * - Explicit dependency injection (no service locators)
 * - Domain modules are initialized with their dependencies
 * - Modules expose only their public API (routers, migrations)
 * - No circular dependencies between modules
 */

import type { Application } from "express";

import { DatabaseConnection, MigrationRunner } from "@acme/db";
import { EventBus } from "@acme/shared";
import { createAuthModule, authMigrations } from "@acme/auth";
import { createUsersModule, usersMigrations } from "@acme/users";
import { createBillingModule, billingMigrations } from "@acme/billing";

import { createApp } from "./app.js";

export interface BootstrapConfig {
  env: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
}

export interface BootstrapResult {
  app: Application;
  config: BootstrapConfig;
  shutdown: () => Promise<void>;
}

/**
 * Bootstrap the entire application.
 * This is the single place where all wiring happens.
 */
export async function bootstrap(): Promise<BootstrapResult> {
  // 1. Load configuration from environment
  const config = loadConfig();

  // 2. Initialize infrastructure
  const db = new DatabaseConnection();
  await db.connect(config.databaseUrl);
  console.log("✅ Database connected");

  // 3. Initialize shared services
  const eventBus = new EventBus();

  // 4. Run migrations from all domains
  const migrationRunner = new MigrationRunner(db);
  migrationRunner.registerDomain(authMigrations);
  migrationRunner.registerDomain(usersMigrations);
  migrationRunner.registerDomain(billingMigrations);
  await migrationRunner.runAll();
  console.log("✅ Migrations complete");

  // 5. Initialize domain modules
  // IMPORTANT: Modules receive their dependencies explicitly.
  // No global state, no service locators.
  const authModule = createAuthModule({
    db,
    eventBus,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: 3600,
  } as any);

  const usersModule = createUsersModule({
    db,
    eventBus,
  });

  const billingModule = createBillingModule({
    db,
    eventBus,
    authModule
  });

  console.log("✅ Domain modules initialized");

  // 6. Create Express app and mount domain routers
  // Each domain's router is mounted under its namespace
  const app = createApp({
    routers: {
      "/auth": authModule.router,
      "/users": usersModule.router,
      "/billing": billingModule.router,
    },
  });

  console.log("✅ Express app created");

  // 7. Return app and cleanup function
  return {
    app,
    config,
    shutdown: async () => {
      await db.disconnect();
    },
  };
}

function loadConfig(): BootstrapConfig {
  const env = process.env['NODE_ENV'] ?? "development";
  const port = parseInt(process.env['PORT'] ?? "3000", 10);
  const databaseUrl = process.env['DATABASE_URL'];
  const jwtSecret = process.env['JWT_SECRET'];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return {
    env,
    port,
    databaseUrl,
    jwtSecret,
  };
}
