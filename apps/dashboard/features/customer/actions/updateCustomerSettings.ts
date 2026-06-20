"use server";

import { revalidatePath } from "next/cache";
import { fetchMutation } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";
import { getTranslations } from "next-intl/server";

import { readCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";

export type CustomerSettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  intent?: "add" | "remove" | "save" | "disable";
  scheduleEnabled?: boolean;
};

type ActionMessageKey =
  | "sessionExpired"
  | "unsupportedForwarding"
  | "unsupportedSchedule"
  | "proRequired"
  | "primaryAlreadyTrusted"
  | "invalidEmail"
  | "invalidAccountant"
  | "accountantRequired"
  | "invalidDay"
  | "addressAdded"
  | "addressRemoved"
  | "addressAddFailed"
  | "addressRemoveFailed"
  | "scheduleSaved"
  | "scheduleDisabled"
  | "scheduleSaveFailed";

type ActionTranslator = (key: ActionMessageKey) => string;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function errorState(
  message: string,
  intent?: CustomerSettingsActionState["intent"],
): CustomerSettingsActionState {
  return { status: "error", message, intent };
}

function mutationError(
  error: unknown,
  intent: CustomerSettingsActionState["intent"],
  fallback: string,
  t: ActionTranslator,
) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("PRO_REQUIRED")) {
    return errorState(t("proRequired"), intent);
  }
  if (message.includes("FORWARDING_EMAIL_IS_PRIMARY")) {
    return errorState(t("primaryAlreadyTrusted"), intent);
  }
  if (message.includes("INVALID_FORWARDING_EMAIL")) {
    return errorState(t("invalidEmail"), intent);
  }
  if (message.includes("INVALID_ACCOUNTANT_EMAIL")) {
    return errorState(t("invalidAccountant"), intent);
  }
  if (message.includes("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE")) {
    return errorState(t("accountantRequired"), intent);
  }
  if (message.includes("EXPORT_SCHEDULE_DAY_OUT_OF_RANGE")) {
    return errorState(t("invalidDay"), intent);
  }

  console.error("Customer settings mutation failed", {
    intent,
    message: message || "Unknown error",
  });
  return errorState(fallback, intent);
}

async function authToken(
  intent: CustomerSettingsActionState["intent"],
  t: ActionTranslator,
): Promise<string | CustomerSettingsActionState> {
  const token = await readCustomerAuthToken();
  return token ?? errorState(t("sessionExpired"), intent);
}

export async function updateForwardingAddress(
  _previousState: CustomerSettingsActionState,
  formData: FormData,
): Promise<CustomerSettingsActionState> {
  const t = await getTranslations("Settings.actions");
  const intent = field(formData, "intent");
  if (intent !== "add" && intent !== "remove") {
    return errorState(t("unsupportedForwarding"));
  }

  const email = field(formData, "email").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorState(t("invalidEmail"), intent);
  }

  const token = await authToken(intent, t);
  if (typeof token !== "string") return token;

  try {
    await fetchMutation(
      intent === "add"
        ? api.users.addForwardingAddress
        : api.users.removeForwardingAddress,
      { email },
      { token },
    );
    revalidatePath("/settings");

    return {
      status: "success",
      intent,
      message: intent === "add" ? t("addressAdded") : t("addressRemoved"),
    };
  } catch (error) {
    return mutationError(
      error,
      intent,
      intent === "add" ? t("addressAddFailed") : t("addressRemoveFailed"),
      t,
    );
  }
}

export async function updateAccountantDeliverySettings(
  _previousState: CustomerSettingsActionState,
  formData: FormData,
): Promise<CustomerSettingsActionState> {
  const t = await getTranslations("Settings.actions");
  const intent = field(formData, "intent");
  if (intent !== "save" && intent !== "disable") {
    return errorState(t("unsupportedSchedule"));
  }

  const token = await authToken(intent, t);
  if (typeof token !== "string") return token;

  try {
    if (intent === "disable") {
      await fetchMutation(
        api.users.updateExportSchedule,
        { exportScheduleDay: undefined },
        { token },
      );
      revalidatePath("/settings");
      return {
        status: "success",
        intent,
        scheduleEnabled: false,
        message: t("scheduleDisabled"),
      };
    }

    const accountantEmail = field(formData, "accountantEmail").trim();
    const accountantName = field(formData, "accountantName").trim();
    const scheduleEnabled = field(formData, "scheduleEnabled") === "on";
    const scheduleDay = Number(field(formData, "exportScheduleDay"));

    if (
      accountantEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountantEmail)
    ) {
      return errorState(t("invalidAccountant"), intent);
    }
    if (scheduleEnabled && !accountantEmail) {
      return errorState(t("accountantRequired"), intent);
    }
    if (
      scheduleEnabled &&
      (!Number.isInteger(scheduleDay) || scheduleDay < 1 || scheduleDay > 28)
    ) {
      return errorState(t("invalidDay"), intent);
    }

    await fetchMutation(
      api.users.updateAccountantDeliverySettings,
      {
        accountantEmail,
        accountantName,
        exportScheduleDay: scheduleEnabled ? scheduleDay : undefined,
      },
      { token },
    );
    revalidatePath("/settings");

    return {
      status: "success",
      intent,
      scheduleEnabled,
      message: scheduleEnabled ? t("scheduleSaved") : t("scheduleDisabled"),
    };
  } catch (error) {
    return mutationError(error, intent, t("scheduleSaveFailed"), t);
  }
}
