/**
 * Shared primitive types used across domains.
 *
 * ARCHITECTURAL DECISION:
 * These are branded types that provide type safety without runtime overhead.
 * A UserId cannot be accidentally used where an Email is expected.
 */

import type { Brand } from "./utility-types.js";

// Branded primitive types
export type UserId = Brand<string, "UserId">;
export type Email = Brand<string, "Email">;
export type Timestamp = Brand<number, "Timestamp">;

// Factory functions with validation
export function createUserId(value: string): UserId {
  if (!value || value.trim().length === 0) {
    throw new Error("UserId cannot be empty");
  }
  return value as UserId;
}

export function createEmail(value: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`Invalid email format: ${value}`);
  }
  return value.toLowerCase() as Email;
}

export function createTimestamp(value?: number): Timestamp {
  return (value ?? Date.now()) as Timestamp;
}
