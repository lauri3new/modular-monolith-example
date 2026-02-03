import type { DomainMigrations } from "@acme/db";

export const usersMigrations: DomainMigrations = {
  domain: "users",
  migrations: [
    {
      name: "000_create_schema",
      up: `CREATE SCHEMA IF NOT EXISTS users;`,
      down: `DROP SCHEMA IF EXISTS users CASCADE;`,
    },
    {
      name: "001_create_user_profiles_table",
      up: `
        CREATE TABLE IF NOT EXISTS users.profiles (
          id UUID PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          display_name VARCHAR(100),
          avatar_url VARCHAR(500),
          bio TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `,
      down: `
        DROP TABLE IF EXISTS users.profiles;
      `,
    },
  ],
};
