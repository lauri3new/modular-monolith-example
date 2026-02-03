/**
 * Integration tests for user profile creation in the users domain.
 *
 * Tests the event-driven flow where a user profile is created
 * when a user registers (via the auth.user_registered event).
 */

import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { getTestDatabase, cleanSchema } from "@acme/test-utils";
import { EventBus, createUserId } from "@acme/shared";
import { createUsersModule } from "../module.js";

/** Generate a valid UUID for test user IDs */
const randomUserId = () => createUserId(crypto.randomUUID());

interface UserProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

describe("User Profile Creation Integration", () => {
  let eventBus: EventBus;

  beforeEach(async () => {
    const db = await getTestDatabase();
    await cleanSchema(db, "users");

    eventBus = new EventBus();

    // Create the users module which subscribes to events
    createUsersModule({ db, eventBus });
  });

  describe("when user registers", () => {
    it("should create a user profile for new user", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();
      const email = "newuser@example.com";

      // Simulate the auth domain publishing a user registered event
      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email,
        occurredAt: new Date(),
      });

      // Verify profile was created
      const result = await db.query<UserProfileRow>(
        "SELECT * FROM users.profiles WHERE id = $1",
        [userId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        id: userId,
        email,
      });
    });

    it("should store email from the registration event", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();
      const email = "specific.email@domain.com";

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email,
        occurredAt: new Date(),
      });

      const result = await db.query<UserProfileRow>(
        "SELECT email FROM users.profiles WHERE id = $1",
        [userId]
      );

      expect(result.rows[0]?.email).toBe(email);
    });

    it("should set optional fields to null initially", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email: "test@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<UserProfileRow>(
        "SELECT display_name, avatar_url, bio FROM users.profiles WHERE id = $1",
        [userId]
      );

      const profile = result.rows[0];
      expect(profile?.display_name).toBeNull();
      expect(profile?.avatar_url).toBeNull();
      expect(profile?.bio).toBeNull();
    });

    it("should set created_at timestamp", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();
      const beforeCreation = new Date();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email: "timestamp@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<UserProfileRow>(
        "SELECT created_at FROM users.profiles WHERE id = $1",
        [userId]
      );

      const createdAt = new Date(result.rows[0]!.created_at);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime() - 1000
      );
    });

    it("should not duplicate profile on repeated events (idempotent)", async () => {
      const db = await getTestDatabase();
      const userId = randomUserId();
      const email = "idempotent@example.com";

      // Publish the same event twice
      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email,
        occurredAt: new Date(),
      });

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId,
        email,
        occurredAt: new Date(),
      });

      // Should still only have one profile
      const result = await db.query<UserProfileRow>(
        "SELECT * FROM users.profiles WHERE id = $1",
        [userId]
      );

      expect(result.rows).toHaveLength(1);
    });

    it("should create separate profiles for different users", async () => {
      const db = await getTestDatabase();
      const userId1 = randomUserId();
      const userId2 = randomUserId();

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId: userId1,
        email: "user1@example.com",
        occurredAt: new Date(),
      });

      await eventBus.publish({
        eventType: "auth.user_registered",
        userId: userId2,
        email: "user2@example.com",
        occurredAt: new Date(),
      });

      const result = await db.query<UserProfileRow>(
        "SELECT * FROM users.profiles ORDER BY created_at"
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.id).toBe(userId1);
      expect(result.rows[0]?.email).toBe("user1@example.com");
      expect(result.rows[1]?.id).toBe(userId2);
      expect(result.rows[1]?.email).toBe("user2@example.com");
    });
  });
});
