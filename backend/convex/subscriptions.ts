import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import { internal } from "./_generated/api";
import {
  httpAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

import type { Id } from "./_generated/dataModel";

const subscriptionStatus = v.union(
  v.literal("active"),
  v.literal("past_due"),
  v.literal("cancelled")
);

const handledWebhookEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_payment_success",
  "subscription_cancelled",
  "subscription_payment_failed",
]);

type InternalSubscriptionStatus = "active" | "past_due" | "cancelled";

type LemonSqueezyWebhookPayload = {
  meta?: {
    event_name?: unknown;
    custom_data?: unknown;
  };
  data?: {
    id?: unknown;
    type?: unknown;
    attributes?: Record<string, unknown>;
  };
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberOrStringId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return optionalString(value);
}

function parseTimestamp(value: unknown) {
  const raw = optionalString(value);
  if (!raw) return undefined;

  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualText(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index++) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );

  return toHex(digest);
}

async function verifyLemonSqueezySignature(
  rawBody: string,
  signature: string | null,
  secret: string
) {
  if (!signature) return false;

  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqualText(expected, signature);
}

function mapSubscriptionStatus(
  eventName: string,
  lemonSqueezyStatus: string | undefined
): InternalSubscriptionStatus {
  if (eventName === "subscription_cancelled") return "cancelled";
  if (eventName === "subscription_payment_failed") return "past_due";
  if (eventName === "subscription_payment_success") return "active";
  if (lemonSqueezyStatus === "active" || lemonSqueezyStatus === "on_trial") {
    return "active";
  }
  if (lemonSqueezyStatus === "past_due" || lemonSqueezyStatus === "unpaid") {
    return "past_due";
  }
  if (
    lemonSqueezyStatus === "cancelled" ||
    lemonSqueezyStatus === "expired" ||
    lemonSqueezyStatus === "paused"
  ) {
    return "cancelled";
  }

  return "cancelled";
}

function extractSubscriptionId(payload: LemonSqueezyWebhookPayload) {
  const attributes = payload.data?.attributes;

  return (
    numberOrStringId(attributes?.subscription_id) ??
    optionalString(payload.data?.id)
  );
}

function extractCustomUserId(payload: LemonSqueezyWebhookPayload) {
  if (!isRecord(payload.meta?.custom_data)) {
    return undefined;
  }

  return optionalString(payload.meta.custom_data.user_id);
}

function extractCurrentPeriodEnd(attributes: Record<string, unknown>) {
  return (
    parseTimestamp(attributes.renews_at) ??
    parseTimestamp(attributes.ends_at) ??
    parseTimestamp(attributes.updated_at) ??
    parseTimestamp(attributes.created_at)
  );
}

export const getSubscription = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return null;
    }

    return {
      lemonSqueezySubscriptionId: subscription.lemonSqueezySubscriptionId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  },
});

export const getUsersBySubscriptionStatus = internalQuery({
  args: {
    status: subscriptionStatus,
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();

    const users = await Promise.all(
      subscriptions.map((subscription) => ctx.db.get(subscription.userId))
    );

    return users.filter((user) => user !== null);
  },
});

export const syncSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    lemonSqueezySubscriptionId: v.string(),
    status: subscriptionStatus,
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("lemonSqueezySubscriptionId", (q) =>
        q.eq("lemonSqueezySubscriptionId", args.lemonSqueezySubscriptionId)
      )
      .first();
    const currentPeriodEnd =
      args.currentPeriodEnd ?? existing?.currentPeriodEnd ?? Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        status: args.status,
        currentPeriodEnd,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        lemonSqueezySubscriptionId: args.lemonSqueezySubscriptionId,
        status: args.status,
        currentPeriodEnd,
      });
    }

    await ctx.db.patch(args.userId, {
      isPro: args.status === "active",
    });
  },
});

export const lemonSqueezyWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    return jsonResponse(500, {
      ok: false,
      code: "LEMONSQUEEZY_WEBHOOK_SECRET_NOT_CONFIGURED",
    });
  }

  const rawBody = await request.text();
  const isVerified = await verifyLemonSqueezySignature(
    rawBody,
    request.headers.get("x-signature"),
    webhookSecret
  );

  if (!isVerified) {
    return jsonResponse(401, {
      ok: false,
      code: "INVALID_SIGNATURE",
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: "INVALID_JSON",
    });
  }

  if (!isRecord(payload)) {
    return jsonResponse(400, {
      ok: false,
      code: "INVALID_PAYLOAD",
    });
  }

  const event = payload as LemonSqueezyWebhookPayload;
  const eventName = optionalString(event.meta?.event_name);

  if (!eventName || !handledWebhookEvents.has(eventName)) {
    return jsonResponse(200, {
      ok: true,
      ignored: true,
      eventName,
    });
  }

  const attributes = event.data?.attributes;
  if (!isRecord(attributes)) {
    return jsonResponse(400, {
      ok: false,
      code: "MISSING_ATTRIBUTES",
    });
  }

  const customUserId = extractCustomUserId(event);
  const customerEmail = optionalString(attributes.user_email);
  const subscriptionId = extractSubscriptionId(event);

  if ((!customerEmail && !customUserId) || !subscriptionId) {
    return jsonResponse(400, {
      ok: false,
      code: "MISSING_SUBSCRIPTION_CONTEXT",
      eventName,
    });
  }

  const user = customUserId
    ? await ctx.runQuery(internal.users.getUserById, {
        userId: customUserId as Id<"users">,
      })
    : customerEmail
      ? await ctx.runQuery(internal.users.getUserByEmail, {
          email: customerEmail,
        })
      : null;

  if (!user) {
    console.error("LemonSqueezy webhook customer not found", {
      eventName,
      customUserId,
      customerEmail,
      subscriptionId,
    });
    return jsonResponse(200, {
      ok: true,
      ignored: true,
      reason: "USER_NOT_FOUND",
    });
  }

  await ctx.runMutation(internal.subscriptions.syncSubscription, {
    userId: user._id as Id<"users">,
    lemonSqueezySubscriptionId: subscriptionId,
    status: mapSubscriptionStatus(eventName, optionalString(attributes.status)),
    currentPeriodEnd: extractCurrentPeriodEnd(attributes),
  });

  return jsonResponse(200, {
    ok: true,
    eventName,
  });
});
