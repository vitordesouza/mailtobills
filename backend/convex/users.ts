import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, internalQuery, mutation } from "./_generated/server";

import { requirePro } from "./lib/requirePro";

function normalizedOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

export const getUserByForwardingEmail = internalQuery({
  args: { fromEmail: v.string() },
  handler: async (ctx, args) => {
    // First, try to find by primary email using the index
    if (args.fromEmail) {
      const byPrimaryEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.fromEmail))
        .first();

      if (byPrimaryEmail) {
        return byPrimaryEmail;
      }
    }

    // If not found by primary email, check forwardingEmails arrays
    // Note: We need to query all users since we can't efficiently index array membership
    const allUsers = await ctx.db.query("users").collect();

    const byForwarding = allUsers.find(
      (user) =>
        user.isPro &&
        Array.isArray(user.forwardingEmails) &&
        user.forwardingEmails.includes(args.fromEmail)
    );

    return byForwarding ?? null;
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateExportSchedule = mutation({
  args: {
    accountantEmail: v.optional(v.string()),
    accountantName: v.optional(v.string()),
    exportScheduleDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const accountantEmail = normalizedOptionalString(args.accountantEmail);
    const accountantName = normalizedOptionalString(args.accountantName);

    if (args.exportScheduleDay !== undefined) {
      if (
        !Number.isInteger(args.exportScheduleDay) ||
        args.exportScheduleDay < 1 ||
        args.exportScheduleDay > 28
      ) {
        throw new Error("EXPORT_SCHEDULE_DAY_OUT_OF_RANGE");
      }
    }

    if (accountantEmail && !isPlausibleEmail(accountantEmail)) {
      throw new Error("INVALID_ACCOUNTANT_EMAIL");
    }

    await ctx.db.patch(userId, {
      accountantEmail,
      accountantName,
      exportScheduleDay: args.exportScheduleDay,
    });
  },
});

export const addForwardingAddress = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const email = normalizeEmail(args.email);

    if (!isPlausibleEmail(email)) {
      throw new Error("INVALID_FORWARDING_EMAIL");
    }

    const user = await ctx.db.get(userId);
    const forwardingEmails = user?.forwardingEmails ?? [];

    if (user?.email && normalizeEmail(user.email) === email) {
      throw new Error("FORWARDING_EMAIL_IS_PRIMARY");
    }

    if (forwardingEmails.includes(email)) {
      return;
    }

    await ctx.db.patch(userId, {
      forwardingEmails: [...forwardingEmails, email],
    });
  },
});

export const removeForwardingAddress = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const email = normalizeEmail(args.email);
    const user = await ctx.db.get(userId);

    await ctx.db.patch(userId, {
      forwardingEmails: (user?.forwardingEmails ?? []).filter(
        (forwardingEmail) => forwardingEmail !== email
      ),
    });
  },
});
