import { getAuthUserId } from "@convex-dev/auth/server";

import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthenticatedDbCtx = Pick<QueryCtx | MutationCtx, "auth" | "db">;

export async function requireSignedInUserId(ctx: Pick<AuthenticatedDbCtx, "auth">) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("UNAUTHENTICATED");
  }

  return userId;
}

export async function requirePro(ctx: AuthenticatedDbCtx) {
  const userId = await requireSignedInUserId(ctx);
  const user = await ctx.db.get(userId);

  if (!user?.isPro) {
    throw new Error("PRO_REQUIRED");
  }

  return userId;
}
