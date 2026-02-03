/**
 * Integration tests for the RegisterUser use case.
 *
 * These tests verify the full flow from use case to database,
 * including the repository implementation and domain events.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTestDatabase, cleanSchema } from "@acme/test-utils";
import { EventBus } from "@acme/shared";

import { RegisterUserUseCase } from "../application/use-cases/register-user.use-case.js";
import { PgUserCredentialsRepository } from "../infrastructure/persistence/pg-user-credentials.repository.js";
import { Email } from "../domain/value-objects/email.value-object.js";
import {
  EmailAlreadyExistsError,
  InvalidEmailError,
  InvalidPasswordError,
} from "../application/errors.js";

describe("RegisterUser Integration", () => {
  let repository: PgUserCredentialsRepository;
  let eventBus: EventBus;
  let useCase: RegisterUserUseCase;

  beforeEach(async () => {
    const db = await getTestDatabase();
    await cleanSchema(db, "auth");

    repository = new PgUserCredentialsRepository(db);
    eventBus = new EventBus();
    useCase = new RegisterUserUseCase({
      userCredentialsRepository: repository,
      eventBus,
    });
  });

  describe("successful registration", () => {
    it("should create a new user with valid credentials", async () => {
      const result = await useCase.execute({
        email: "test@example.com",
        password: "SecurePassword123!",
      });

      expect(result).toMatchObject({
        email: "test@example.com",
        isVerified: false,
      });
      expect(result.id).toBeDefined();
    });

    it("should persist the user in the database", async () => {
      const result = await useCase.execute({
        email: "persist@example.com",
        password: "SecurePassword123!",
      });

      const emailResult = Email.create("persist@example.com");
      if (!emailResult.isOk()) {
        throw new Error("Failed to create email for test");
      }

      const found = await repository.findByEmail(emailResult.value);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(result.id);
    });

    it("should publish UserRegistered event", async () => {
      const eventHandler = vi.fn();
      eventBus.subscribe("auth.user_registered", eventHandler);

      await useCase.execute({
        email: "event@example.com",
        password: "SecurePassword123!",
      });

      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "auth.user_registered",
          email: "event@example.com",
        })
      );
    });

    it("should normalize email to lowercase", async () => {
      const result = await useCase.execute({
        email: "TEST@EXAMPLE.COM",
        password: "SecurePassword123!",
      });

      expect(result.email).toBe("test@example.com");
    });
  });

  describe("validation errors", () => {
    it("should reject invalid email format", async () => {
      await expect(
        useCase.execute({
          email: "invalid-email",
          password: "SecurePassword123!",
        })
      ).rejects.toThrow(InvalidEmailError);
    });

    it("should reject weak password", async () => {
      await expect(
        useCase.execute({
          email: "test@example.com",
          password: "weak",
        })
      ).rejects.toThrow(InvalidPasswordError);
    });
  });

  describe("duplicate email", () => {
    it("should reject registration with existing email", async () => {
      // First registration
      await useCase.execute({
        email: "duplicate@example.com",
        password: "SecurePassword123!",
      });

      // Second registration with same email should fail
      await expect(
        useCase.execute({
          email: "duplicate@example.com",
          password: "DifferentPassword123!",
        })
      ).rejects.toThrow(EmailAlreadyExistsError);
    });

    it("should reject registration with same email in different case", async () => {
      await useCase.execute({
        email: "case@example.com",
        password: "SecurePassword123!",
      });

      await expect(
        useCase.execute({
          email: "CASE@EXAMPLE.COM",
          password: "SecurePassword123!",
        })
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });
});
