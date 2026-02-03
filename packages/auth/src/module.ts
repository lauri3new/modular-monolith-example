/**
 * Auth Module Factory
 *
 * ARCHITECTURAL DECISION:
 * This is the composition root for the Auth domain. It:
 * - Wires up all internal dependencies
 * - Returns only the public interface (router, migrations)
 * - Keeps internal implementation hidden
 *
 * The module pattern provides a clean way to initialize
 * a domain with all its dependencies.
 */

import type { Router } from "express";
import type { DatabaseConnection } from "@acme/db";
import type { EventBus } from "@acme/shared";

import { createAuthRouter } from "./infrastructure/http/router.js";
import { PgUserCredentialsRepository } from "./infrastructure/persistence/pg-user-credentials.repository.js";
import { authMigrations } from "./infrastructure/migrations/index.js";

export interface AuthModuleConfig {
  db: DatabaseConnection;
  eventBus: EventBus;
  jwtSecret: string;
  jwtExpiresIn?: number;
}

export interface AuthModule {
  router: Router;
  migrations: typeof authMigrations;
  banana: string;
}

/**
 * Creates and initializes the Auth module with all dependencies.
 */
export function createAuthModule(config: AuthModuleConfig): AuthModule {
  // Create infrastructure implementations
  const userCredentialsRepository = new PgUserCredentialsRepository(config.db);

  // Create HTTP router with dependencies
  const router = createAuthRouter({
    userCredentialsRepository,
    eventBus: config.eventBus,
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn ?? 3600, // 1 hour default
  });

  return {
    router,
    migrations: authMigrations,
    banana: 'banana',
  };
}
