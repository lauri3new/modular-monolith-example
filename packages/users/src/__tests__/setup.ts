/**
 * Global test setup for @acme/users integration tests.
 *
 * This file runs before all tests in the users package.
 * It ensures the test database has the users domain migrations applied.
 */

import { beforeAll, afterAll } from "vitest";
import {
  getTestDatabase,
  closeTestDatabase,
  dropSchema,
} from "@acme/test-utils";
import { MigrationRunner } from "@acme/db";
import { usersMigrations } from "../infrastructure/migrations/index.js";

beforeAll(async () => {
  console.log("🔧 Setting up users integration tests...");

  const db = await getTestDatabase();

  // Reset only the users schema for isolation (allows parallel package runs)
  await dropSchema(db, "users");

  const migrationRunner = new MigrationRunner(db);
  migrationRunner.registerDomain(usersMigrations);
  await migrationRunner.runAll();

  console.log("✅ Users test database ready");
});

afterAll(async () => {
  console.log("🧹 Cleaning up users integration tests...");
  await closeTestDatabase();
});
