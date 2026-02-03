/**
 * Password Value Object
 *
 * ARCHITECTURAL DECISION:
 * Password hashing is a domain concern - it's part of the
 * authentication business rules. The value object ensures
 * passwords are always properly validated and hashed.
 */

import bcrypt from "bcrypt";

import { ValueObject, type Result, Ok, Err } from "@acme/shared";

interface PasswordProps {
  hashedValue: string;
}

export class Password extends ValueObject<PasswordProps> {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_LENGTH = 8;

  private constructor(props: PasswordProps) {
    super(props);
  }

  static async create(plainPassword: string): Promise<Result<Password, string>> {
    if (!plainPassword || plainPassword.length < Password.MIN_LENGTH) {
      return new Err(`Password must be at least ${Password.MIN_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(plainPassword)) {
      return new Err("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(plainPassword)) {
      return new Err("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(plainPassword)) {
      return new Err("Password must contain at least one number");
    }

    const hashedValue = await bcrypt.hash(plainPassword, Password.SALT_ROUNDS);
    return new Ok(new Password({ hashedValue }));
  }

  static fromHash(hashedValue: string): Password {
    return new Password({ hashedValue });
  }

  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.props.hashedValue);
  }

  get hashedValue(): string {
    return this.props.hashedValue;
  }
}
