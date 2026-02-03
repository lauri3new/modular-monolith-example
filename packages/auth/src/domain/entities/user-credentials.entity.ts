/**
 * UserCredentials Entity
 *
 * ARCHITECTURAL DECISION:
 * This is the aggregate root for the Auth bounded context.
 * It encapsulates authentication-related data and behavior.
 *
 * Note: This is NOT the same as a "User" in other domains.
 * Auth only cares about credentials and authentication state.
 * Other domains have their own view of what a "user" means.
 */

import { Entity, type UserId } from "@acme/shared";

import { Password } from "../value-objects/password.value-object.js";
import { Email } from "../value-objects/email.value-object.js";

export interface UserCredentialsProps {
  email: Email;
  password: Password;
  isVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export class UserCredentials extends Entity<UserId> {
  private props: UserCredentialsProps;

  private constructor(id: UserId, props: UserCredentialsProps) {
    super(id);
    this.props = props;
  }

  static create(
    id: UserId,
    email: Email,
    password: Password
  ): UserCredentials {
    return new UserCredentials(id, {
      email,
      password,
      isVerified: false,
      lastLoginAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(
    id: UserId,
    props: UserCredentialsProps
  ): UserCredentials {
    return new UserCredentials(id, props);
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return this.props.password.verify(plainPassword);
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
  }

  verify(): void {
    this.props.isVerified = true;
  }

  changePassword(newPassword: Password): void {
    this.props.password = newPassword;
  }
}

type X = {
  id: string
}

const x: X = {
  id: '1'
}