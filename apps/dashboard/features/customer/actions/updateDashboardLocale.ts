"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";
import { isLocale, localeCookieName, type Locale } from "@mailtobills/i18n";

import { readCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";

export type DashboardLocaleActionResult =
  | { status: "success"; locale: Locale }
  | { status: "error" };

export async function updateDashboardLocale(
  requestedLocale: string,
): Promise<DashboardLocaleActionResult> {
  if (!isLocale(requestedLocale)) {
    return { status: "error" };
  }

  const token = await readCustomerAuthToken();

  try {
    if (token) {
      await fetchMutation(
        api.users.updateLocale,
        { locale: requestedLocale },
        { token },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(localeCookieName, requestedLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    revalidatePath("/", "layout");

    return { status: "success", locale: requestedLocale };
  } catch (error) {
    console.error("Dashboard locale update failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      requestedLocale,
    });
    return { status: "error" };
  }
}
