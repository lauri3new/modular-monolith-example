/**
 * Domain Events - The backbone of inter-domain communication.
 *
 * ARCHITECTURAL DECISION:
 * Domains must NOT import each other directly. Domain events provide
 * a decoupled way for domains to react to changes in other domains.
 *
 * Example: When a user registers (Auth domain), the Users domain
 * can react by creating a user profile without Auth knowing about Users.
 */

export abstract class DomainEvent {
  readonly occurredAt: Date;
  abstract readonly eventType: string;

  constructor() {
    this.occurredAt = new Date();
  }
}

export type DomainEventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

type EventHandlers = Map<string, Set<DomainEventHandler<DomainEvent>>>;

/**
 * Simple in-memory event bus for domain events.
 *
 * ARCHITECTURAL DECISION:
 * This is a synchronous, in-memory event bus suitable for a monolith.
 * For production, consider:
 * - Adding transactional outbox pattern for reliability
 * - Using a message broker for async processing
 * - Adding event sourcing if audit trail is needed
 */
export class EventBus {
  private handlers: EventHandlers = new Map();

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const eventHandlers = this.handlers.get(eventType)!;
    eventHandlers.add(handler as DomainEventHandler<DomainEvent>);

    // Return unsubscribe function
    return () => {
      eventHandlers.delete(handler as DomainEventHandler<DomainEvent>);
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventType);
    if (!eventHandlers) {
      return;
    }

    const handlerPromises = Array.from(eventHandlers).map((handler) =>
      handler(event)
    );

    await Promise.all(handlerPromises);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}
