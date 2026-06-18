import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { getCustomerPortalUrlForSubscription } from "@/lib/lemonsqueezy";

export async function GET(request: Request) {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.viewer, {}, { token });

  if (!token || !user?._id) {
    return Response.redirect(new URL("/signin", request.url), 303);
  }

  const subscription = await fetchQuery(
    api.subscriptions.getMySubscription,
    {},
    { token }
  );

  if (!subscription) {
    return Response.redirect(new URL("/settings", request.url), 303);
  }

  const portalUrl = await getCustomerPortalUrlForSubscription(
    subscription.lemonSqueezySubscriptionId
  );

  return Response.redirect(portalUrl, 303);
}
