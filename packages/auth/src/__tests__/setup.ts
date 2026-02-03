/**
 * Global test setup for @acme/auth integration tests.
 *
 * This file runs before all tests in the auth package.
 * It ensures the test database has the auth domain migrations applied.
 */

import { beforeAll, afterAll } from "vitest";
import {
  getTestDatabase,
  closeTestDatabase,
  dropSchema,
} from "@acme/test-utils";
import { MigrationRunner } from "@acme/db";
import { authMigrations } from "../infrastructure/migrations/index.js";

beforeAll(async () => {
  console.log("🔧 Setting up auth integration tests...");

  const db = await getTestDatabase();

  // Reset only the auth schema for isolation (allows parallel package runs)
  await dropSchema(db, "auth");

  const migrationRunner = new MigrationRunner(db);
  migrationRunner.registerDomain(authMigrations);
  await migrationRunner.runAll();

  console.log("✅ Auth test database ready");
});

afterAll(async () => {
  console.log("🧹 Cleaning up auth integration tests...");
  await closeTestDatabase();
});
