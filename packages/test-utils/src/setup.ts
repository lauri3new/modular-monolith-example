/**
 * Vitest setup utilities for integration tests.
 *
 * Provides hooks and helpers for test lifecycle management.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { DatabaseConnection } from "@acme/db";
import {
  getTestDatabase,
  closeTestDatabase,
  cleanDatabase,
  TEST_DATABASE_URL,
} from "./database.js";

export interface IntegrationTestContext {
  db: DatabaseConnection;
}

/**
 * Setup integration test hooks for a test file.
 *
 * This provides:
 * - Database connection before all tests
 * - Database cleanup before each test
 * - Database disconnection after all tests
 *
 * @example
 * ```typescript
 * import { setupIntegrationTest } from "@acme/test-utils";
 *
 * const { getDb } = setupIntegrationTest();
 *
 * describe("MyFeature", () => {
 *   it("should work", async () => {
 *     const db = getDb();
 *     // ... test code
 *   });
 * });
 * ```
 */
export function setupIntegrationTest(options?: {
  /** Run migrations before tests. Pass the migration runner function. */
  runMigrations?: (db: DatabaseConnection) => Promise<void>;
  /** Clean database before each test (default: true) */
  cleanBeforeEach?: boolean;
}) {
  const { runMigrations, cleanBeforeEach = true } = options ?? {};

  let db: DatabaseConnection;

  beforeAll(async () => {
    db = await getTestDatabase();

    if (runMigrations) {
      await runMigrations(db);
    }
  });

  if (cleanBeforeEach) {
    beforeEach(async () => {
      await cleanDatabase(db);
    });
  }

  afterAll(async () => {
    await closeTestDatabase();
  });

  return {
    getDb: () => db,
    getDatabaseUrl: () => TEST_DATABASE_URL,
  };
}

/**
 * Create a test context with transaction isolation.
 *
 * Each test runs in a transaction that is rolled back after the test,
 * providing complete isolation without the overhead of truncating tables.
 *
 * @example
 * ```typescript
 * import { setupTransactionalTest } from "@acme/test-utils";
 *
 * const { getDb } = setupTransactionalTest();
 *
 * describe("MyFeature", () => {
 *   it("should work", async () => {
 *     const db = getDb();
 *     // Changes are automatically rolled back after test
 *   });
 * });
 * ```
 */
export function setupTransactionalTest(options?: {
  runMigrations?: (db: DatabaseConnection) => Promise<void>;
}) {
  const { runMigrations } = options ?? {};

  let db: DatabaseConnection;
  let client: Awaited<ReturnType<DatabaseConnection["getClient"]>>;

  beforeAll(async () => {
    db = await getTestDatabase();

    if (runMigrations) {
      await runMigrations(db);
    }
  });

  beforeEach(async () => {
    client = await db.getClient();
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
    client.release();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  return {
    getDb: () => db,
    getClient: () => client,
    getDatabaseUrl: () => TEST_DATABASE_URL,
  };
}
