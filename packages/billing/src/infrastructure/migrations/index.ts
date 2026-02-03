import type { DomainMigrations } from "@acme/db";

export const billingMigrations: DomainMigrations = {
  domain: "billing",
  migrations: [
    {
      name: "001_create_subscriptions_table",
      up: `
        CREATE TABLE IF NOT EXISTS billing_subscriptions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          plan VARCHAR(50) NOT NULL DEFAULT 'free',
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ends_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_billing_subscriptions_user_id
          ON billing_subscriptions(user_id);
      `,
      down: `
        DROP TABLE IF EXISTS billing_subscriptions;
      `,
    },
  ],
};
