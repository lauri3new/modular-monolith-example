/**
 * UserCredentials Repository Interface
 *
 * ARCHITECTURAL DECISION:
 * The repository interface is defined in the domain layer,
 * but implemented in the infrastructure layer. This follows
 * the Dependency Inversion Principle - the domain doesn't
 * depend on infrastructure details.
 */

import type { UserId } from "@acme/shared";

import type { UserCredentials } from "../entities/user-credentials.entity.js";
import type { Email } from "../value-objects/email.value-object.js";

export interface UserCredentialsRepository {
  findById(id: UserId): Promise<UserCredentials | null>;
  findByEmail(email: Email): Promise<UserCredentials | null>;
  save(userCredentials: UserCredentials): Promise<void>;
  existsByEmail(email: Email): Promise<boolean>;
}
