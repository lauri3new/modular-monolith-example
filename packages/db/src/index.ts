/**
 * DATABASE PACKAGE
 *
 * ARCHITECTURAL DECISION:
 * - Single database instance shared across all domains
 * - Each domain owns its tables and migrations
 * - This package provides only connection primitives
 * - No domain-specific queries here
 */

export { DatabaseConnection, type QueryResult } from "./connection.js";
export { Transaction, type TransactionClient } from "./transaction.js";
export { MigrationRunner, type DomainMigrations, type Migration } from "./migration-runner.js";
