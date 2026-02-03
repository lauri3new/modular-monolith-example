import type { Router } from "express";
import type { DatabaseConnection } from "@acme/db";
import type { EventBus, UserId } from "@acme/shared";
import type { AuthModule } from "@acme/auth-types";

import { createBillingRouter } from "./infrastructure/http/router.js";
import { billingMigrations } from "./infrastructure/migrations/index.js";

export interface BillingModuleConfig {
  db: DatabaseConnection;
  eventBus: EventBus;
  authModule: AuthModule;
}

export interface BillingModule {
  router: Router;
  migrations: typeof billingMigrations;
}

export function createBillingModule(config: BillingModuleConfig): BillingModule {
  const router = createBillingRouter({ db: config.db });

  // Subscribe to Auth domain events to create free subscription for new users
  config.eventBus.subscribe<{
    eventType: "auth.user_registered";
    userId: UserId;
    email: string;
    occurredAt: Date;
  }>("auth.user_registered", async (event) => {
    console.log(`Creating free subscription for user ${event.userId}`);
    await config.db.query(
      `INSERT INTO billing.subscriptions (id, user_id, plan, status)
       VALUES (gen_random_uuid(), $1, 'free', 'active')`,
      [event.userId]
    );
  });

  return {
    router,
    migrations: billingMigrations,
  };
}
