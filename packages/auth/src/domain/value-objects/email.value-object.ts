/**
 * Email Value Object
 *
 * ARCHITECTURAL DECISION:
 * Value objects encapsulate validation and behavior.
 * An invalid email cannot be constructed.
 */

import { ValueObject, type Result, Ok, Err } from "@acme/shared";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Result<Email, string> {
    const normalized = email.toLowerCase().trim();

    if (!normalized) {
      return new Err("Email cannot be empty");
    }

    if (!Email.EMAIL_REGEX.test(normalized)) {
      return new Err("Invalid email format");
    }

    return new Ok(new Email({ value: normalized }));
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
