/**
 * Global test setup for @acme/billing integration tests.
 *
 * This file runs before all tests in the billing package.
 * It ensures the test database has the billing domain migrations applied.
 */

import { beforeAll, afterAll } from "vitest";
import {
  getTestDatabase,
  closeTestDatabase,
  dropSchema,
} from "@acme/test-utils";
import { MigrationRunner } from "@acme/db";
import { billingMigrations } from "../infrastructure/migrations/index.js";

beforeAll(async () => {
  console.log("🔧 Setting up billing integration tests...");

  const db = await getTestDatabase();

  // Reset only the billing schema for isolation (allows parallel package runs)
  await dropSchema(db, "billing");

  const migrationRunner = new MigrationRunner(db);
  migrationRunner.registerDomain(billingMigrations);
  await migrationRunner.runAll();

  console.log("✅ Billing test database ready");
});

afterAll(async () => {
  console.log("🧹 Cleaning up billing integration tests...");
  await closeTestDatabase();
});
