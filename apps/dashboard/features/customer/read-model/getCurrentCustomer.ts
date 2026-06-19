import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";
import type { Id } from "@mailtobills/convex/_generated/dataModel";

export type CurrentCustomer = {
  id: Id<"users">;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro";
  forwardingAddresses: string[];
  accountantAddress: string | null;
  accountantName: string | null;
  exportScheduleDay: number | null;
};

export type CurrentCustomerSession = {
  token: string;
  customer: CurrentCustomer;
};

export const getCustomerAuthToken = cache(
  async (): Promise<string | null> => (await convexAuthNextjsToken()) ?? null,
);

export const getCurrentCustomer = cache(
  async (): Promise<CurrentCustomerSession | null> => {
    const token = await getCustomerAuthToken();
    if (!token) return null;

    const user = await fetchQuery(api.users.viewer, {}, { token });
    if (!user) return null;

    return {
      token,
      customer: {
        id: user._id,
        name: user.name?.trim() || "Customer",
        email: user.email ?? null,
        avatarUrl: user.image ?? null,
        plan: user.isPro ? "pro" : "free",
        forwardingAddresses: user.forwardingEmails ?? [],
        accountantAddress: user.accountantEmail ?? null,
        accountantName: user.accountantName ?? null,
        exportScheduleDay: user.exportScheduleDay ?? null,
      },
    };
  },
);

export async function requireCurrentCustomer(): Promise<CurrentCustomerSession> {
  const session = await getCurrentCustomer();
  if (!session) redirect("/signin");

  return session;
}
