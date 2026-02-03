/**
 * AUTH DOMAIN - PUBLIC API
 *
 * ARCHITECTURAL DECISION:
 * This is the ONLY file that should be imported by other packages.
 * All internal implementation details are hidden behind this facade.
 *
 * Exposes:
 * - Router factory for Express composition
 * - Domain events for inter-domain communication
 * - DTOs for data transfer (no domain entities exposed)
 * - Migrations for database schema management
 */

// Router factory - used by apps/api to mount auth routes
export { createAuthRouter, type AuthRouterDependencies } from "./infrastructure/http/router.js";

// Domain events - other domains can subscribe to these
export { UserRegisteredEvent } from "./domain/events/user-registered.event.js";
export { UserLoggedInEvent } from "./domain/events/user-logged-in.event.js";

// DTOs for external communication
export type {
  RegisterUserDto,
  LoginDto,
  AuthTokenDto,
} from "./application/dtos.js";

// Migrations for database setup
export { authMigrations } from "./infrastructure/migrations/index.js";

// Module initialization
export { createAuthModule, type AuthModule } from "./module.js";
