import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { createProCheckout } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.viewer, {}, { token });

  if (!token || !user?._id || !user.email) {
    return Response.redirect(new URL("/signin", request.url), 303);
  }

  const checkoutUrl = await createProCheckout({
    origin: new URL(request.url).origin,
    userId: user._id,
    email: user.email,
    name: user.name,
  });

  return Response.redirect(checkoutUrl, 303);
}
