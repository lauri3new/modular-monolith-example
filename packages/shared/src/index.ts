/**
 * SHARED KERNEL
 *
 * ARCHITECTURAL DECISION:
 * This package contains ONLY:
 * - Base abstractions (Entity, ValueObject, DomainEvent)
 * - Truly shared types used across multiple domains
 * - Generic utility types
 *
 * RULES:
 * - Keep this package small and stable
 * - No domain-specific logic
 * - No external dependencies on domain packages
 * - Changes here affect all domains - be conservative
 */

// Base abstractions
export { Entity } from "./entity.js";
export { ValueObject } from "./value-object.js";
export { DomainEvent, type DomainEventHandler, EventBus } from "./domain-event.js";
export { Ok, Err } from "./result.js";
export type { Result } from "./result.js";

// Common types
export type { UserId, Email, Timestamp } from "./types.js";
export { createUserId, createEmail, createTimestamp } from "./types.js";

// Utility types
export type { Prettify, Brand } from "./utility-types.js";
