/**
 * Application-layer errors for Auth domain
 *
 * ARCHITECTURAL DECISION:
 * Custom error classes provide semantic meaning and can be
 * mapped to appropriate HTTP status codes at the edge.
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor(email: string) {
    super(`User with email ${email} already exists`, "EMAIL_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class UserNotFoundError extends AuthError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class InvalidPasswordError extends AuthError {
  constructor(reason: string) {
    super(reason, "INVALID_PASSWORD");
    this.name = "InvalidPasswordError";
  }
}

export class InvalidEmailError extends AuthError {
  constructor(reason: string) {
    super(reason, "INVALID_EMAIL");
    this.name = "InvalidEmailError";
  }
}
