/**
 * USERS TYPES PACKAGE
 *
 * Type-only package for Users domain interfaces.
 * This package exists to break circular dependencies between domains
 * that need to reference each other's module types for dependency injection.
 */

/**
 * Users module public interface.
 * Handles user profiles and related data.
 */
export interface UsersModule {
  /** Express router for this domain's HTTP endpoints */
  router: unknown;
  /** Database migrations owned by this domain */
  migrations: unknown;
}
