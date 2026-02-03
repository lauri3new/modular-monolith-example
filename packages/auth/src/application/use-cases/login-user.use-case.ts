/**
 * Login User Use Case
 *
 * Handles user authentication and token generation.
 */

import jwt from "jsonwebtoken";

import { type EventBus } from "@acme/shared";

import { Email } from "../../domain/value-objects/email.value-object.js";
import { UserLoggedInEvent } from "../../domain/events/user-logged-in.event.js";
import type { UserCredentialsRepository } from "../../domain/repositories/user-credentials.repository.js";
import type { LoginDto, AuthTokenDto } from "../dtos.js";
import { InvalidCredentialsError, InvalidEmailError } from "../errors.js";

export interface LoginUserDependencies {
  userCredentialsRepository: UserCredentialsRepository;
  eventBus: EventBus;
  jwtSecret: string;
  jwtExpiresIn: number;
}

export class LoginUserUseCase {
  constructor(private readonly deps: LoginUserDependencies) {}

  async execute(dto: LoginDto): Promise<AuthTokenDto> {
    // Validate email format
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      throw new InvalidEmailError(emailResult.error);
    }
    const email = emailResult.value;

    // Find user by email
    const userCredentials =
      await this.deps.userCredentialsRepository.findByEmail(email);

    if (!userCredentials) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValid = await userCredentials.verifyPassword(dto.password);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // Record login and persist
    userCredentials.recordLogin();
    await this.deps.userCredentialsRepository.save(userCredentials);

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        sub: userCredentials.id,
        email: userCredentials.email.value,
      },
      this.deps.jwtSecret,
      { expiresIn: this.deps.jwtExpiresIn }
    );

    // Publish domain event
    const event = new UserLoggedInEvent(userCredentials.id, new Date());
    await this.deps.eventBus.publish(event);

    return {
      accessToken,
      expiresIn: this.deps.jwtExpiresIn,
      tokenType: "Bearer",
    };
  }
}
