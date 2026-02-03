/**
 * Register User Use Case
 *
 * ARCHITECTURAL DECISION:
 * Use cases orchestrate the domain logic for a specific operation.
 * They are the "application services" in DDD terminology.
 *
 * Responsibilities:
 * - Validate input
 * - Coordinate domain objects
 * - Publish domain events
 * - Return results or errors
 */

import { createUserId, type EventBus } from "@acme/shared";
import crypto from "node:crypto";

import { UserCredentials } from "../../domain/entities/user-credentials.entity.js";
import { Email } from "../../domain/value-objects/email.value-object.js";
import { Password } from "../../domain/value-objects/password.value-object.js";
import { UserRegisteredEvent } from "../../domain/events/user-registered.event.js";
import type { UserCredentialsRepository } from "../../domain/repositories/user-credentials.repository.js";
import type { RegisterUserDto, AuthUserDto } from "../dtos.js";
import {
  EmailAlreadyExistsError,
  InvalidEmailError,
  InvalidPasswordError,
} from "../errors.js";

export interface RegisterUserDependencies {
  userCredentialsRepository: UserCredentialsRepository;
  eventBus: EventBus;
}

export class RegisterUserUseCase {
  constructor(private readonly deps: RegisterUserDependencies) {}

  async execute(dto: RegisterUserDto): Promise<AuthUserDto> {
    // Create and validate email value object
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      throw new InvalidEmailError(emailResult.error);
    }
    const email = emailResult.value;

    // Check if email already exists
    const exists = await this.deps.userCredentialsRepository.existsByEmail(email);
    if (exists) {
      throw new EmailAlreadyExistsError(dto.email);
    }

    // Create and validate password value object
    const passwordResult = await Password.create(dto.password);
    if (passwordResult.isErr()) {
      throw new InvalidPasswordError(passwordResult.error);
    }
    const password = passwordResult.value;

    // Create the user credentials entity
    const userId = createUserId(crypto.randomUUID());
    const userCredentials = UserCredentials.create(userId, email, password);

    // Persist the entity
    await this.deps.userCredentialsRepository.save(userCredentials);

    // Publish domain event
    const event = new UserRegisteredEvent(userId, email.value);
    await this.deps.eventBus.publish(event);

    // Return DTO (not the entity!)
    return {
      id: userCredentials.id,
      email: userCredentials.email.value,
      isVerified: userCredentials.isVerified,
    };
  }
}
