import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";
import type { Id } from "@mailtobills/convex/_generated/dataModel";
import type { Locale } from "@mailtobills/i18n";

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
  locale: Locale | null;
};

export type CurrentCustomerSession = {
  token: string;
  customer: CurrentCustomer;
};

export async function readCustomerAuthToken(): Promise<string | null> {
  return (await convexAuthNextjsToken()) ?? null;
}

async function readCustomerWithToken(
  token: string | null,
): Promise<CurrentCustomerSession | null> {
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
      locale: user.locale ?? null,
    },
  };
}

export async function readCurrentCustomer(): Promise<CurrentCustomerSession | null> {
  return readCustomerWithToken(await readCustomerAuthToken());
}

export const getCustomerAuthToken = cache(readCustomerAuthToken);

export const getCurrentCustomer = cache(
  async (): Promise<CurrentCustomerSession | null> =>
    readCustomerWithToken(await getCustomerAuthToken()),
);

export async function requireCurrentCustomer(): Promise<CurrentCustomerSession> {
  const session = await getCurrentCustomer();
  if (!session) redirect("/signin");

  return session;
}
