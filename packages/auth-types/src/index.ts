/**
 * AUTH TYPES PACKAGE
 *
 * Type-only package for Auth domain interfaces.
 * This package exists to break circular dependencies between domains
 * that need to reference each other's module types for dependency injection.
 */

/**
 * Auth module public interface.
 * Handles user authentication, registration, and JWT tokens.
 */
export interface AuthModule {
  /** Express router for this domain's HTTP endpoints */
  router: unknown;
  /** Database migrations owned by this domain */
  migrations: unknown;
}
