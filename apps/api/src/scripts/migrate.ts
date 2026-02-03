/**
 * Database Migration Script
 *
 * Run with: pnpm --filter @acme/api db:migrate
 *
 * This script runs all migrations from all domain packages.
 */

import { DatabaseConnection, MigrationRunner } from "@acme/db";
import { authMigrations } from "@acme/auth";
import { usersMigrations } from "@acme/users";
import { billingMigrations } from "@acme/billing";

async function migrate(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = new DatabaseConnection();

  try {
    await db.connect(databaseUrl);
    console.log("Connected to database");

    const runner = new MigrationRunner(db);

    // Register all domain migrations
    runner.registerDomain(authMigrations);
    runner.registerDomain(usersMigrations);
    runner.registerDomain(billingMigrations);

    // Run all migrations
    await runner.runAll();

    console.log("All migrations complete");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

migrate();
