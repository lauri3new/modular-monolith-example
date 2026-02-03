/**
 * Transaction management for database operations.
 *
 * ARCHITECTURAL DECISION:
 * Explicit transaction handling allows domains to ensure
 * data consistency within their boundaries.
 */

import type { PoolClient, QueryResultRow } from "pg";

import { type DatabaseConnection, type QueryResult } from "./connection.js";

export interface TransactionClient {
  query<T extends QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>>;
}

export class Transaction {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async run<T>(fn: (client: TransactionClient) => Promise<T>): Promise<T> {
    const client = await this.db.getClient();

    try {
      await client.query("BEGIN");

      const transactionClient: TransactionClient = {
        async query<R extends QueryResultRow>(
          sql: string,
          params?: unknown[]
        ): Promise<QueryResult<R>> {
          const result = await client.query<R>(sql, params);
          return {
            rows: result.rows,
            rowCount: result.rowCount,
          };
        },
      };

      const result = await fn(transactionClient);

      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
