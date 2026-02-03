/**
 * @acme/test-utils
 *
 * Shared testing utilities for integration tests across all domain packages.
 */

export {
  TEST_DATABASE_URL,
  DOMAIN_SCHEMAS,
  type DomainSchema,
  getTestDatabase,
  closeTestDatabase,
  cleanSchema,
  cleanDatabase,
  dropSchema,
  dropAllTables,
  isDatabaseAvailable,
} from "./database.js";

export {
  setupIntegrationTest,
  setupTransactionalTest,
  type IntegrationTestContext,
} from "./setup.js";
