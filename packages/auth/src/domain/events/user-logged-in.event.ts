/**
 * UserLoggedIn Domain Event
 *
 * Published when a user successfully authenticates.
 */

import { DomainEvent, type UserId } from "@acme/shared";

export class UserLoggedInEvent extends DomainEvent {
  readonly eventType = "auth.user_logged_in" as const;

  constructor(
    public readonly userId: UserId,
    public readonly timestamp: Date
  ) {
    super();
  }
}
