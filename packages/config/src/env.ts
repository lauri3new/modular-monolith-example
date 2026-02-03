/**
 * Environment configuration with runtime validation using Zod.
 *
 * ARCHITECTURAL DECISION:
 * - All environment variables are validated at startup
 * - This fails fast if configuration is missing or invalid
 * - Type-safe access to environment variables throughout the application
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Parse and validate environment variables.
 * Results are cached after first successful parse.
 *
 * @throws {ZodError} If environment validation fails
 */
export function parseEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Get validated environment. Must call parseEnv() first during bootstrap.
 *
 * @throws {Error} If parseEnv() hasn't been called
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    throw new Error("Environment not initialized. Call parseEnv() during bootstrap.");
  }
  return cachedEnv;
}
