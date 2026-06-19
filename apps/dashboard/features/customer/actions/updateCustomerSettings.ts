"use server";

import { revalidatePath } from "next/cache";
import { fetchMutation } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";

import { readCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";

export type CustomerSettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  intent?: "add" | "remove" | "save" | "disable";
  scheduleEnabled?: boolean;
};

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
) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("PRO_REQUIRED")) {
    return errorState("Upgrade to Pro to change these settings.", intent);
  }
  if (message.includes("FORWARDING_EMAIL_IS_PRIMARY")) {
    return errorState(
      "The Primary Forwarding Address is already trusted.",
      intent,
    );
  }
  if (message.includes("INVALID_FORWARDING_EMAIL")) {
    return errorState("Enter a valid email address.", intent);
  }
  if (message.includes("INVALID_ACCOUNTANT_EMAIL")) {
    return errorState("A valid Accountant Address is required.", intent);
  }
  if (message.includes("ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE")) {
    return errorState(
      "A valid Accountant Address is required to enable the schedule.",
      intent,
    );
  }
  if (message.includes("EXPORT_SCHEDULE_DAY_OUT_OF_RANGE")) {
    return errorState("Choose an Export Schedule day from 1 to 28.", intent);
  }

  console.error("Customer settings mutation failed", {
    intent,
    message: message || "Unknown error",
  });
  return errorState(fallback, intent);
}

async function authToken(
  intent: CustomerSettingsActionState["intent"],
): Promise<string | CustomerSettingsActionState> {
  const token = await readCustomerAuthToken();
  return token ?? errorState("Your session expired. Sign in again.", intent);
}

export async function updateForwardingAddress(
  _previousState: CustomerSettingsActionState,
  formData: FormData,
): Promise<CustomerSettingsActionState> {
  const intent = field(formData, "intent");
  if (intent !== "add" && intent !== "remove") {
    return errorState("Unsupported Forwarding Address action.");
  }

  const email = field(formData, "email").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorState("Enter a valid email address.", intent);
  }

  const token = await authToken(intent);
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
      message:
        intent === "add"
          ? "Forwarding Address added."
          : "Forwarding Address removed.",
    };
  } catch (error) {
    return mutationError(
      error,
      intent,
      intent === "add"
        ? "Could not add Forwarding Address."
        : "Could not remove Forwarding Address.",
    );
  }
}

export async function updateAccountantDeliverySettings(
  _previousState: CustomerSettingsActionState,
  formData: FormData,
): Promise<CustomerSettingsActionState> {
  const intent = field(formData, "intent");
  if (intent !== "save" && intent !== "disable") {
    return errorState("Unsupported Export Schedule action.");
  }

  const token = await authToken(intent);
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
        message: "Export Schedule disabled.",
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
      return errorState("A valid Accountant Address is required.", intent);
    }
    if (scheduleEnabled && !accountantEmail) {
      return errorState(
        "A valid Accountant Address is required to enable the schedule.",
        intent,
      );
    }
    if (
      scheduleEnabled &&
      (!Number.isInteger(scheduleDay) || scheduleDay < 1 || scheduleDay > 28)
    ) {
      return errorState("Choose an Export Schedule day from 1 to 28.", intent);
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
      message: scheduleEnabled
        ? "Export Schedule saved."
        : "Export Schedule disabled.",
    };
  } catch (error) {
    return mutationError(error, intent, "Could not save Export Schedule.");
  }
}
