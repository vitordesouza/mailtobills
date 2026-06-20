import "server-only";

import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@mailtobills/i18n";

import { getCurrentCustomer } from "@/features/customer/read-model/getCurrentCustomer";

export async function resolveDashboardLocale(): Promise<Locale> {
  const [session, cookieStore] = await Promise.all([
    getCurrentCustomer(),
    cookies(),
  ]);

  if (session?.customer.locale) {
    return session.customer.locale;
  }

  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  return cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}
