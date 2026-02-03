/**
 * BILLING TYPES PACKAGE
 *
 * Type-only package for Billing domain interfaces.
 * This package exists to break circular dependencies between domains
 * that need to reference each other's module types for dependency injection.
 */

/**
 * Billing module public interface.
 * Handles subscriptions, payments, and invoices.
 */
export interface BillingModule {
  /** Express router for this domain's HTTP endpoints */
  router: unknown;
  /** Database migrations owned by this domain */
  migrations: unknown;
  banana: string;
}
