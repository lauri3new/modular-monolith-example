/**
 * Auth Domain Migrations
 *
 * ARCHITECTURAL DECISION:
 * Each domain owns its database migrations. This ensures:
 * - Domain autonomy over its data model
 * - Clear ownership of database schema
 * - Ability to evolve schema independently
 *
 * Migrations are registered with the central MigrationRunner during bootstrap.
 * The runner tracks which migrations have been applied per domain.
 */

import type { DomainMigrations } from "@acme/db";

export const authMigrations: DomainMigrations = {
  domain: "auth",
  migrations: [
    {
      name: "000_create_schema",
      up: `CREATE SCHEMA IF NOT EXISTS auth;`,
      down: `DROP SCHEMA IF EXISTS auth CASCADE;`,
    },
    {
      name: "001_create_user_credentials_table",
      up: `
        CREATE TABLE IF NOT EXISTS auth.user_credentials (
          id UUID PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT user_credentials_email_lowercase
            CHECK (email = LOWER(email))
        );

        CREATE INDEX idx_auth_user_credentials_email
          ON auth.user_credentials(email);
      `,
      down: `
        DROP TABLE IF EXISTS auth.user_credentials;
      `,
    },
    {
      name: "002_add_refresh_tokens_table",
      up: `
        CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.user_credentials(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          revoked_at TIMESTAMP
        );

        CREATE INDEX idx_auth_refresh_tokens_user_id
          ON auth.refresh_tokens(user_id);
        CREATE INDEX idx_auth_refresh_tokens_token_hash
          ON auth.refresh_tokens(token_hash);
      `,
      down: `
        DROP TABLE IF EXISTS auth.refresh_tokens;
      `,
    },
  ],
};
