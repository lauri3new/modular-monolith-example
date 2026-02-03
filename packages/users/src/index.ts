/**
 * USERS DOMAIN - PUBLIC API
 *
 * This domain handles user profiles and related data.
 * It subscribes to Auth domain events to create profiles
 * when users register.
 */

export { createUsersRouter, type UsersRouterDependencies } from "./infrastructure/http/router.js";
export { usersMigrations } from "./infrastructure/migrations/index.js";
export { createUsersModule, type UsersModule } from "./module.js";
export { UserProfileCreatedEvent } from "./domain/events/user-profile-created.event.js";
