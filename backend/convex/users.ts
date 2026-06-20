import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  query,
  internalQuery,
  internalMutation,
  mutation,
} from "./_generated/server";

import { requirePro } from "./lib/requirePro";
import {
  addForwardingAddress as addForwardingAddressToCustomer,
  findCustomerByForwardingAddress,
  normalizeEmailAddress,
  removeForwardingAddress as removeForwardingAddressFromCustomer,
} from "./lib/forwardingAddresses";
import {
  buildAccountantAddressPatch,
  buildAccountantDeliverySettingsPatch,
  buildExportSchedulePatch,
} from "./lib/accountantDeliverySettings";

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
    const fromEmail = normalizeEmailAddress(args.fromEmail);

    // First, try to find by normalized primary email using the index.
    if (fromEmail) {
      const byPrimaryEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", fromEmail))
        .first();

      if (byPrimaryEmail) {
        return byPrimaryEmail;
      }
    }

    // If not found by primary email, check forwardingEmails arrays
    // Note: We need to query all users since we can't efficiently index array membership
    const allUsers = await ctx.db.query("users").collect();

    return findCustomerByForwardingAddress(allUsers, fromEmail);
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

export const getAccountantExportCustomer = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return {
      name: user.name,
      email: user.email,
      isPro: user.isPro,
      accountantEmail: user.accountantEmail,
      accountantName: user.accountantName,
    };
  },
});

export const updateExportSchedule = mutation({
  args: {
    exportScheduleDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const user = await ctx.db.get(userId);

    await ctx.db.patch(userId, {
      ...buildExportSchedulePatch(user, args),
    });
  },
});

export const updateAccountantAddress = mutation({
  args: {
    accountantEmail: v.optional(v.string()),
    accountantName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const user = await ctx.db.get(userId);

    await ctx.db.patch(userId, {
      ...buildAccountantAddressPatch(args, user),
    });
  },
});

export const updateAccountantDeliverySettings = mutation({
  args: {
    accountantEmail: v.string(),
    accountantName: v.string(),
    exportScheduleDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);

    await ctx.db.patch(userId, {
      ...buildAccountantDeliverySettingsPatch(args),
    });
  },
});

export const updateLocale = mutation({
  args: {
    locale: v.union(v.literal("en"), v.literal("pt-PT")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("UNAUTHENTICATED");
    }

    await ctx.db.patch(userId, { locale: args.locale });
  },
});

export const addForwardingAddress = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const user = await ctx.db.get(userId);

    await ctx.db.patch(userId, {
      forwardingEmails: addForwardingAddressToCustomer(user, args.email),
    });
  },
});

export const removeForwardingAddress = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requirePro(ctx);
    const user = await ctx.db.get(userId);

    await ctx.db.patch(userId, {
      forwardingEmails: removeForwardingAddressFromCustomer(user, args.email),
    });
  },
});

export const getUsersDueForExport = internalQuery({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    // Pro Customers whose Export Schedule day matches today and who have an
    // Accountant Address configured. Table scan is acceptable at current scale;
    // add an index on exportScheduleDay when the user count grows.
    const users = await ctx.db.query("users").collect();

    return users.filter(
      (user) =>
        user.isPro === true &&
        user.exportScheduleDay === args.day &&
        !!user.accountantEmail,
    );
  },
});

export const markExportScheduleSent = internalMutation({
  args: {
    userId: v.id("users"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      exportScheduleLastSentMonth: args.month,
    });
  },
});
