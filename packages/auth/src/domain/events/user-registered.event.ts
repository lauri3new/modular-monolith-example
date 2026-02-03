/**
 * UserRegistered Domain Event
 *
 * ARCHITECTURAL DECISION:
 * This event is published when a user successfully registers.
 * Other domains can subscribe to this event to:
 * - Create a user profile (Users domain)
 * - Set up billing account (Billing domain)
 * - Send welcome email (Notifications domain)
 *
 * The event contains only the minimal data needed for subscribers.
 * Subscribers should NOT depend on implementation details.
 */

import { DomainEvent, type UserId } from "@acme/shared";

export class UserRegisteredEvent extends DomainEvent {
  readonly eventType = "auth.user_registered" as const;

  constructor(
    public readonly userId: UserId,
    public readonly email: string
  ) {
    super();
  }
}
