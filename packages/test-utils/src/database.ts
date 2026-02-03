/**
 * Database utilities for integration tests.
 *
 * Provides setup and teardown helpers that can be used across all domain packages.
 * Each test file gets an isolated database state through transaction rollbacks.
 */

import { DatabaseConnection } from "@acme/db";

export const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://test:test@localhost:5433/acme_test";

let sharedConnection: DatabaseConnection | null = null;

/**
 * Get or create a shared database connection for tests.
 * The connection is reused across all tests in a package run.
 */
export async function getTestDatabase(): Promise<DatabaseConnection> {
  if (sharedConnection && sharedConnection.isConnected()) {
    return sharedConnection;
  }

  sharedConnection = new DatabaseConnection();
  await sharedConnection.connect(TEST_DATABASE_URL);
  return sharedConnection;
}

/**
 * Close the shared database connection.
 * Call this in globalTeardown or afterAll at the suite level.
 */
export async function closeTestDatabase(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.disconnect();
    sharedConnection = null;
  }
}

/** Domain schemas used in the application */
export const DOMAIN_SCHEMAS = ["auth", "users", "billing"] as const;
export type DomainSchema = (typeof DOMAIN_SCHEMAS)[number];

/**
 * Clean all tables in a specific schema.
 * Useful for resetting state between tests within a package.
 */
export async function cleanSchema(
  db: DatabaseConnection,
  schema: DomainSchema
): Promise<void> {
  const result = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
    [schema]
  );

  if (result.rows.length === 0) {
    return;
  }

  const tableNames = result.rows
    .map((r) => `"${schema}"."${r.tablename}"`)
    .join(", ");
  await db.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
}

/**
 * Clean all tables in the test database across all domain schemas.
 * Useful for resetting state between test suites.
 */
export async function cleanDatabase(db: DatabaseConnection): Promise<void> {
  // Get all tables from domain schemas
  const result = await db.query<{ schemaname: string; tablename: string }>(
    `SELECT schemaname, tablename FROM pg_tables 
     WHERE schemaname = ANY($1)`,
    [DOMAIN_SCHEMAS]
  );

  if (result.rows.length === 0) {
    return;
  }

  // Truncate all tables with CASCADE to handle foreign keys
  const tableNames = result.rows
    .map((r) => `"${r.schemaname}"."${r.tablename}"`)
    .join(", ");
  await db.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE`);
}

/**
 * Drop a specific schema and its tables.
 * Useful for complete reset before running migrations for a single domain.
 */
export async function dropSchema(
  db: DatabaseConnection,
  schema: DomainSchema
): Promise<void> {
  await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  // Remove migration records for this domain (table may not exist yet)
  try {
    await db.query(`DELETE FROM _migrations WHERE domain = $1`, [schema]);
  } catch {
    // _migrations table doesn't exist yet, that's fine
  }
}

/**
 * Drop all domain schemas and their tables.
 * Useful for complete reset before running migrations.
 * WARNING: Only use when running tests sequentially, not in parallel.
 */
export async function dropAllTables(db: DatabaseConnection): Promise<void> {
  // Drop each domain schema with CASCADE (removes all tables)
  for (const schema of DOMAIN_SCHEMAS) {
    await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  }

  // Also clean up the migrations table in public schema
  await db.query(`DROP TABLE IF EXISTS _migrations CASCADE`);
}

/**
 * Check if the test database is accessible.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const db = new DatabaseConnection();
    await db.connect(TEST_DATABASE_URL);
    await db.disconnect();
    return true;
  } catch {
    return false;
  }
}
