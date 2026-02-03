/**
 * Database connection management.
 *
 * ARCHITECTURAL DECISION:
 * Using a connection pool for efficient resource usage.
 * Connection is initialized once during bootstrap and reused.
 */

import { Pool, type PoolClient, type QueryResultRow } from "pg";

export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number | null;
}

export class DatabaseConnection {
  private pool: Pool | null = null;

  async connect(connectionString: string): Promise<void> {
    if (this.pool) {
      return;
    }

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Verify connection
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T extends QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }

    const result = await this.pool.query<T>(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    };
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.pool.connect();
  }

  isConnected(): boolean {
    return this.pool !== null;
  }
}
