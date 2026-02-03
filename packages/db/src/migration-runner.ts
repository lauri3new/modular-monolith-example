/**
 * Migration runner that executes migrations from all domains.
 *
 * ARCHITECTURAL DECISION:
 * - Each domain owns its migrations in its own package
 * - This runner collects and executes them in order
 * - Migration state is tracked in a shared migrations table
 * - Domains register their migrations during bootstrap
 */

import type { DatabaseConnection } from "./connection.js";

export interface Migration {
  name: string;
  up: string;
  down: string;
}

export interface DomainMigrations {
  domain: string;
  migrations: Migration[];
}

export class MigrationRunner {
  private db: DatabaseConnection;
  private domainMigrations: DomainMigrations[] = [];

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  registerDomain(domainMigrations: DomainMigrations): void {
    this.domainMigrations.push(domainMigrations);
  }

  async initialize(): Promise<void> {
    try {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(domain, name)
        )
      `);
    } catch (error) {
      console.error("Error initializing migrations table:", error);
    }
  }

  async runAll(): Promise<void> {
    await this.initialize();

    for (const { domain, migrations } of this.domainMigrations) {
      for (const migration of migrations) {
        const executed = await this.isMigrationExecuted(domain, migration.name);
        if (!executed) {
          console.log(`Running migration: ${domain}/${migration.name}`);
          await this.db.query(migration.up);
          await this.recordMigration(domain, migration.name);
        }
      }
    }
  }

  private async isMigrationExecuted(
    domain: string,
    name: string
  ): Promise<boolean> {
    const result = await this.db.query(
      "SELECT 1 FROM _migrations WHERE domain = $1 AND name = $2",
      [domain, name]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async recordMigration(domain: string, name: string): Promise<void> {
    await this.db.query(
      "INSERT INTO _migrations (domain, name) VALUES ($1, $2)",
      [domain, name]
    );
  }
}
