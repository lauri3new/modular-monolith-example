/**
 * Users Module Factory
 *
 * ARCHITECTURAL DECISION:
 * This module subscribes to Auth domain events to create
 * user profiles when users register. This demonstrates
 * inter-domain communication via events.
 */

import type { Router } from "express";
import type { DatabaseConnection } from "@acme/db";
import type { EventBus, UserId } from "@acme/shared";

import { createUsersRouter } from "./infrastructure/http/router.js";
import { usersMigrations } from "./infrastructure/migrations/index.js";

export interface UsersModuleConfig {
  db: DatabaseConnection;
  eventBus: EventBus;
}

export interface UsersModule {
  router: Router;
  migrations: typeof usersMigrations;
}

export function createUsersModule(config: UsersModuleConfig): UsersModule {
  const router = createUsersRouter({ db: config.db });

  // Subscribe to Auth domain events
  // This is how domains communicate without direct imports
  config.eventBus.subscribe<{
    eventType: "auth.user_registered";
    userId: UserId;
    email: string;
    occurredAt: Date;
  }>("auth.user_registered", async (event) => {
    console.log(`Creating user profile for ${event.email}`);
    // Implementation: create user profile in users_profiles table
    await config.db.query(
      `INSERT INTO users_profiles (id, email) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [event.userId, event.email]
    );
  });

  return {
    router,
    migrations: usersMigrations,
  };
}
