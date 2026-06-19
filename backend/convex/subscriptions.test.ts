/// <reference types="vitest/importMeta" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { internal } from "./_generated/api";
import schema from "./schema";

const modules = (
  import.meta as ImportMeta & {
    glob(patterns: string[]): Record<string, () => Promise<unknown>>;
  }
).glob(["./**/*.*s", "!./**/*.test.ts"]);

describe("Subscription state transitions", () => {
  it("syncs an active Subscription and caches Pro Plan access on the Customer", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", {
        email: "owner@example.com",
        isPro: false,
      }),
    );

    await t.mutation(internal.subscriptions.syncSubscription, {
      userId,
      lemonSqueezySubscriptionId: "sub_123",
      status: "active",
      currentPeriodEnd: 1781837647000,
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    const subscription = await t.query(internal.subscriptions.getSubscription, {
      userId,
    });

    expect(user?.isPro).toBe(true);
    expect(subscription).toEqual(
      expect.objectContaining({
        userId,
        lemonSqueezySubscriptionId: "sub_123",
        status: "active",
        currentPeriodEnd: 1781837647000,
      }),
    );
  });

  it("clears Pro Plan access when a Subscription lapses", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", {
        email: "owner@example.com",
        isPro: true,
      }),
    );

    await t.mutation(internal.subscriptions.syncSubscription, {
      userId,
      lemonSqueezySubscriptionId: "sub_123",
      status: "active",
      currentPeriodEnd: 1781837647000,
    });
    await t.mutation(internal.subscriptions.syncSubscription, {
      userId,
      lemonSqueezySubscriptionId: "sub_123",
      status: "past_due",
      currentPeriodEnd: 1784429647000,
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    const subscription = await t.query(internal.subscriptions.getSubscription, {
      userId,
    });

    expect(user?.isPro).toBe(false);
    expect(subscription).toEqual(
      expect.objectContaining({
        userId,
        lemonSqueezySubscriptionId: "sub_123",
        status: "past_due",
        currentPeriodEnd: 1784429647000,
      }),
    );
  });

  it("keeps preserved Pro feature configuration when a Subscription is cancelled", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", {
        email: "owner@example.com",
        isPro: true,
        accountantEmail: "accountant@example.com",
        exportScheduleDay: 5,
        forwardingEmails: ["billing@example.com"],
      }),
    );

    await t.mutation(internal.subscriptions.syncSubscription, {
      userId,
      lemonSqueezySubscriptionId: "sub_123",
      status: "cancelled",
      currentPeriodEnd: 1781837647000,
    });

    const user = await t.run((ctx) => ctx.db.get(userId));

    expect(user).toEqual(
      expect.objectContaining({
        isPro: false,
        accountantEmail: "accountant@example.com",
        exportScheduleDay: 5,
        forwardingEmails: ["billing@example.com"],
      }),
    );
  });
});
