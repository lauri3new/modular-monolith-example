/**
 * BILLING DOMAIN - PUBLIC API
 *
 * This domain handles subscriptions, payments, and invoices.
 */

export { createBillingRouter, type BillingRouterDependencies } from "./infrastructure/http/router.js";
export { billingMigrations } from "./infrastructure/migrations/index.js";
export { createBillingModule, type BillingModule } from "./module.js";
