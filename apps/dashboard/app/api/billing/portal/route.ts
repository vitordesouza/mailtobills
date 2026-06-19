import { fetchQuery } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";

import { getCurrentCustomer } from "@/features/customer/read-model/getCurrentCustomer";
import { getCustomerPortalUrlForSubscription } from "@/lib/lemonsqueezy";

export async function GET(request: Request) {
  const session = await getCurrentCustomer();

  if (!session) {
    return Response.redirect(new URL("/signin", request.url), 303);
  }

  const subscription = await fetchQuery(
    api.subscriptions.getMySubscription,
    {},
    { token: session.token },
  );

  if (!subscription) {
    return Response.redirect(new URL("/settings", request.url), 303);
  }

  const portalUrl = await getCustomerPortalUrlForSubscription(
    subscription.lemonSqueezySubscriptionId,
  );

  return Response.redirect(portalUrl, 303);
}
