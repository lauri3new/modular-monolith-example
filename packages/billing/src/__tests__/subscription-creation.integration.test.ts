/**
 * Integration tests for subscription creation in the billing domain.
 *
 * Tests the event-driven flow where a new subscription is created
 * when a user registers (via the auth.user_registered event).
 */

import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { getTestDatabase, cleanSchema } from "@acme/test-utils";
import { EventBus, createUserId } from "@acme/shared";
import { createBillingModule } from "../module.js";

/** Generate a valid UUID for test user IDs */
const randomUserId = () => createUserId(crypto.randomUUID());

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  started_at: Date;
  ends_at: Date | null;
  created_at: Date;
}

describe("Subscription Creation Integration", () => {
  let eventBus: EventBus;

  beforeEach(async () => {
    const db = await getTestDatabase();
    await cleanSchema(db, "billing");

    eventBus = new EventBus();

    // Create the billing module which subscribes to events
    createBillingModule({ db, eventBus, authModule: {} as any });
  });

  describe("when user registers", () => {
    it("should create a free subscription for new user", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();

      // Simulate the auth domain publishing a user registered event
      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email: "test@example.com",
        occurredAt: new Date(),
      });

      // Verify subscription was created
      const result = await db.query<SubscriptionRow>(
        "SELECT * FROM billing.subscriptions WHERE user_id = $1",
        [userId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        user_id: userId,
        plan: "free",
        status: "active",
      });
    });

    it("should set subscription started_at to current time", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();
      const beforeCreation = new Date();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email: "another@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<SubscriptionRow>(
        "SELECT * FROM billing.subscriptions WHERE user_id = $1",
        [userId]
      );

      const subscription = result.rows[0];
      expect(subscription).toBeDefined();
      expect(new Date(subscription!.started_at).getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime() - 1000
      );
    });

    it("should leave ends_at as null for free plan", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email: "free@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<SubscriptionRow>(
        "SELECT * FROM billing.subscriptions WHERE user_id = $1",
        [userId]
      );

      expect(result.rows[0]?.ends_at).toBeNull();
    });

    it("should create separate subscriptions for different users", async () => {
      const db = await getTestDatabase();
      const userId1 = randomUserId();
      const userId2 = randomUserId();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId: userId1,
        email: "one@example.com",
        occurredAt: new Date(),
      });

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId: userId2,
        email: "two@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<SubscriptionRow>(
        "SELECT * FROM billing.subscriptions ORDER BY created_at"
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.user_id).toBe(userId1);
      expect(result.rows[1]?.user_id).toBe(userId2);
    });
  });
});
