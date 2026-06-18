/// <reference types="vitest/importMeta" />

import { convexTest } from "convex-test";
import type { TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = (
  import.meta as ImportMeta & {
    glob(patterns: string[]): Record<string, () => Promise<unknown>>;
  }
).glob(["./**/*.*s", "!./**/*.test.ts"]);

async function insertUser(
  t: TestConvex<typeof schema>,
  user: {
    email: string;
    isPro?: boolean;
    forwardingEmails?: string[];
  },
) {
  return t.run((ctx) => ctx.db.insert("users", user));
}

function asIdentity(userId: Id<"users">) {
  return {
    subject: `${userId}|test-session`,
    email: "user@example.com",
  };
}

describe("user settings Convex functions", () => {
  it("adds normalized forwarding addresses and rejects duplicates of the primary email", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await authed.mutation(api.users.addForwardingAddress, {
      email: " Billing@Example.COM ",
    });
    await authed.mutation(api.users.addForwardingAddress, {
      email: "billing@example.com",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.forwardingEmails).toEqual(["billing@example.com"]);

    await expect(
      authed.mutation(api.users.addForwardingAddress, {
        email: "owner@example.com",
      }),
    ).rejects.toThrow("FORWARDING_EMAIL_IS_PRIMARY");
  });

  it("requires Pro for forwarding addresses and export schedules", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "free@example.com",
      isPro: false,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await expect(
      authed.mutation(api.users.addForwardingAddress, {
        email: "billing@example.com",
      }),
    ).rejects.toThrow("PRO_REQUIRED");
    await expect(
      authed.mutation(api.users.updateExportSchedule, {
        exportScheduleDay: 5,
      }),
    ).rejects.toThrow("PRO_REQUIRED");
    await expect(
      authed.mutation(api.users.updateAccountantAddress, {
        accountantEmail: "accountant@example.com",
      }),
    ).rejects.toThrow("PRO_REQUIRED");
  });

  it("removes forwarding addresses without touching other entries", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
      forwardingEmails: ["one@example.com", "two@example.com"],
    });
    const authed = t.withIdentity(asIdentity(userId));

    await authed.mutation(api.users.removeForwardingAddress, {
      email: "ONE@example.com",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.forwardingEmails).toEqual(["two@example.com"]);
  });

  it("validates export schedules without touching the Accountant Address", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await expect(
      authed.mutation(api.users.updateExportSchedule, {
        exportScheduleDay: 29,
      }),
    ).rejects.toThrow("EXPORT_SCHEDULE_DAY_OUT_OF_RANGE");

    await authed.mutation(api.users.updateAccountantAddress, {
      accountantEmail: " accountant@example.com ",
      accountantName: " Marta ",
    });
    await authed.mutation(api.users.updateExportSchedule, {
      exportScheduleDay: 5,
    });
    await authed.mutation(api.users.updateExportSchedule, {
      exportScheduleDay: undefined,
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.accountantEmail).toBe("accountant@example.com");
    expect(user?.accountantName).toBe("Marta");
    expect(user?.exportScheduleDay).toBeUndefined();
  });

  it("validates and clears the Accountant Address", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await expect(
      authed.mutation(api.users.updateAccountantAddress, {
        accountantEmail: "not-an-email",
      }),
    ).rejects.toThrow("INVALID_ACCOUNTANT_EMAIL");

    await authed.mutation(api.users.updateAccountantAddress, {
      accountantEmail: " accountant@example.com ",
      accountantName: " Marta ",
    });
    await authed.mutation(api.users.updateAccountantAddress, {
      accountantEmail: " ",
      accountantName: " ",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.accountantEmail).toBeUndefined();
    expect(user?.accountantName).toBeUndefined();
  });

  it("finds users by primary or Pro forwarding email and lists due exports", async () => {
    const t = convexTest({ schema, modules });
    const proId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
      forwardingEmails: ["billing@example.com"],
    });
    await t.run((ctx) =>
      ctx.db.patch(proId, {
        accountantEmail: "accountant@example.com",
        exportScheduleDay: 5,
      }),
    );
    await insertUser(t, {
      email: "free@example.com",
      isPro: false,
      forwardingEmails: ["free-forward@example.com"],
    });

    const byPrimary = await t.query(internal.users.getUserByForwardingEmail, {
      fromEmail: "owner@example.com",
    });
    const byForwarding = await t.query(internal.users.getUserByForwardingEmail, {
      fromEmail: "billing@example.com",
    });
    const ignoredFreeForwarding = await t.query(
      internal.users.getUserByForwardingEmail,
      {
        fromEmail: "free-forward@example.com",
      },
    );
    const due = await t.query(internal.users.getUsersDueForExport, { day: 5 });

    expect(byPrimary?._id).toBe(proId);
    expect(byForwarding?._id).toBe(proId);
    expect(ignoredFreeForwarding).toBeNull();
    expect(due.map((user) => user._id)).toEqual([proId]);
  });
});
