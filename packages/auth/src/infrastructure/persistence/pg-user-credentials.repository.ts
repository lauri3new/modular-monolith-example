/**
 * PostgreSQL implementation of UserCredentialsRepository
 *
 * ARCHITECTURAL DECISION:
 * The repository encapsulates all database access for the aggregate.
 * It's responsible for:
 * - Mapping between domain entities and database records
 * - Handling persistence concerns
 * - Maintaining aggregate consistency
 */

import type { DatabaseConnection } from "@acme/db";
import { createUserId, type UserId } from "@acme/shared";

import type { UserCredentialsRepository } from "../../domain/repositories/user-credentials.repository.js";
import { UserCredentials } from "../../domain/entities/user-credentials.entity.js";
import { Email } from "../../domain/value-objects/email.value-object.js";
import { Password } from "../../domain/value-objects/password.value-object.js";

interface UserCredentialsRow {
  id: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
}

export class PgUserCredentialsRepository implements UserCredentialsRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async findById(id: UserId): Promise<UserCredentials | null> {
    const result = await this.db.query<UserCredentialsRow>(
      `SELECT id, email, password_hash, is_verified, last_login_at, created_at
       FROM auth_user_credentials
       WHERE id = $1`,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async findByEmail(email: Email): Promise<UserCredentials | null> {
    const result = await this.db.query<UserCredentialsRow>(
      `SELECT id, email, password_hash, is_verified, last_login_at, created_at
       FROM auth_user_credentials
       WHERE email = $1`,
      [email.value]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async save(userCredentials: UserCredentials): Promise<void> {
    await this.db.query(
      `INSERT INTO auth_user_credentials (id, email, password_hash, is_verified, last_login_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         is_verified = EXCLUDED.is_verified,
         last_login_at = EXCLUDED.last_login_at`,
      [
        userCredentials.id,
        userCredentials.email.value,
        userCredentials.password.hashedValue,
        userCredentials.isVerified,
        userCredentials.lastLoginAt,
        userCredentials.createdAt,
      ]
    );
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM auth_user_credentials WHERE email = $1`,
      [email.value]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private toDomain(row: UserCredentialsRow): UserCredentials {
    const emailResult = Email.create(row.email);
    if (emailResult.isErr()) {
      throw new Error(`Invalid email in database: ${row.email}`);
    }

    return UserCredentials.reconstitute(createUserId(row.id), {
      email: emailResult.value,
      password: Password.fromHash(row.password_hash),
      isVerified: row.is_verified,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    });
  }
}
