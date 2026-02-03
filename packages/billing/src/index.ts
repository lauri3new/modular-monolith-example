/**
 * BILLING DOMAIN - PUBLIC API
 *
 * This domain handles subscriptions, payments, and invoices.
 */

export { createBillingRouter, type BillingRouterDependencies } from "./infrastructure/http/router.js";
export { billingMigrations } from "./infrastructure/migrations/index.js";
export { createBillingModule } from "./module.js";
// Re-export module type from types package (canonical location)
export type { BillingModule } from "@acme/billing-types";
