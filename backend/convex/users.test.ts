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
    accountantEmail?: string;
    accountantName?: string;
    exportScheduleDay?: number;
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
    await expect(
      authed.mutation(api.users.updateExportSchedule, {
        exportScheduleDay: 5,
      }),
    ).rejects.toThrow("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");

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

  it("saves Accountant Delivery settings atomically", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await expect(
      authed.mutation(api.users.updateAccountantDeliverySettings, {
        accountantEmail: "",
        accountantName: "Books",
        exportScheduleDay: 5,
      }),
    ).rejects.toThrow("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");

    await authed.mutation(api.users.updateAccountantDeliverySettings, {
      accountantEmail: " accountant@example.com ",
      accountantName: " Marta ",
      exportScheduleDay: 5,
    });

    const enabled = await t.run((ctx) => ctx.db.get(userId));
    expect(enabled?.accountantEmail).toBe("accountant@example.com");
    expect(enabled?.accountantName).toBe("Marta");
    expect(enabled?.exportScheduleDay).toBe(5);

    await authed.mutation(api.users.updateAccountantDeliverySettings, {
      accountantEmail: " accountant@example.com ",
      accountantName: " Marta ",
      exportScheduleDay: undefined,
    });

    const disabled = await t.run((ctx) => ctx.db.get(userId));
    expect(disabled?.accountantEmail).toBe("accountant@example.com");
    expect(disabled?.accountantName).toBe("Marta");
    expect(disabled?.exportScheduleDay).toBeUndefined();
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

  it("does not clear the Accountant Address while an Export Schedule is enabled", async () => {
    const t = convexTest({ schema, modules });
    const userId = await insertUser(t, {
      email: "owner@example.com",
      isPro: true,
      accountantEmail: "accountant@example.com",
      accountantName: "Marta",
      exportScheduleDay: 5,
    });
    const authed = t.withIdentity(asIdentity(userId));

    await expect(
      authed.mutation(api.users.updateAccountantAddress, {
        accountantEmail: " ",
        accountantName: " ",
      }),
    ).rejects.toThrow("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE");

    await authed.mutation(api.users.updateAccountantAddress, {
      accountantEmail: " books@example.com ",
      accountantName: " Books ",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.accountantEmail).toBe("books@example.com");
    expect(user?.accountantName).toBe("Books");
    expect(user?.exportScheduleDay).toBe(5);
  });

  it("finds users by primary or Pro forwarding email and lists due exports", async () => {
    const t = convexTest({ schema, modules });
    const proId = await insertUser(t, {
      email: "Owner@Example.com",
      isPro: true,
      forwardingEmails: ["Billing@Example.com"],
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
      fromEmail: " OWNER@EXAMPLE.COM ",
    });
    const byForwarding = await t.query(
      internal.users.getUserByForwardingEmail,
      {
        fromEmail: " BILLING@EXAMPLE.COM ",
      },
    );
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
