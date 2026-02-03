import { DomainEvent, type UserId } from "@acme/shared";

export class UserProfileCreatedEvent extends DomainEvent {
  readonly eventType = "users.profile_created" as const;

  constructor(
    public readonly userId: UserId,
    public readonly email: string
  ) {
    super();
  }
}
