import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: vi.fn(),
  fetchMutation: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/customer/read-model/getCurrentCustomer", () => ({
  readCustomerAuthToken: mocks.token,
}));
vi.mock("convex/nextjs", () => ({
  fetchMutation: mocks.fetchMutation,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  updateAccountantDeliverySettings,
  updateForwardingAddress,
  type CustomerSettingsActionState,
} from "./updateCustomerSettings";

const initialState: CustomerSettingsActionState = { status: "idle" };

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("Customer settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token.mockResolvedValue("auth-token");
    mocks.fetchMutation.mockResolvedValue(undefined);
  });

  it("requires a current Customer session", async () => {
    mocks.token.mockResolvedValue(null);

    const result = await updateForwardingAddress(
      initialState,
      formData({ intent: "add", email: "receipts@example.com" }),
    );

    expect(result).toEqual({
      status: "error",
      intent: "add",
      message: "Your session expired. Sign in again.",
    });
    expect(mocks.fetchMutation).not.toHaveBeenCalled();
  });

  it("adds a normalized Forwarding Address and revalidates settings", async () => {
    const result = await updateForwardingAddress(
      initialState,
      formData({ intent: "add", email: " Receipts@Example.com " }),
    );

    expect(mocks.fetchMutation).toHaveBeenCalledWith(
      expect.anything(),
      { email: "receipts@example.com" },
      { token: "auth-token" },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/settings");
    expect(result).toMatchObject({ status: "success", intent: "add" });
  });

  it("validates Forwarding Addresses before calling Convex", async () => {
    const result = await updateForwardingAddress(
      initialState,
      formData({ intent: "add", email: "not-an-email" }),
    );

    expect(result).toMatchObject({
      status: "error",
      message: "Enter a valid email address.",
    });
    expect(mocks.fetchMutation).not.toHaveBeenCalled();
  });

  it("saves Accountant Delivery settings", async () => {
    const result = await updateAccountantDeliverySettings(
      initialState,
      formData({
        intent: "save",
        accountantEmail: "books@example.com",
        accountantName: "Books Team",
        scheduleEnabled: "on",
        exportScheduleDay: "12",
      }),
    );

    expect(mocks.fetchMutation).toHaveBeenCalledWith(
      expect.anything(),
      {
        accountantEmail: "books@example.com",
        accountantName: "Books Team",
        exportScheduleDay: 12,
      },
      { token: "auth-token" },
    );
    expect(result).toMatchObject({
      status: "success",
      intent: "save",
      scheduleEnabled: true,
    });
  });

  it("disables an Export Schedule without changing its address", async () => {
    const result = await updateAccountantDeliverySettings(
      initialState,
      formData({ intent: "disable" }),
    );

    expect(mocks.fetchMutation).toHaveBeenCalledWith(
      expect.anything(),
      { exportScheduleDay: undefined },
      { token: "auth-token" },
    );
    expect(result).toMatchObject({
      status: "success",
      intent: "disable",
      scheduleEnabled: false,
    });
  });

  it("translates Pro Plan failures at the server seam", async () => {
    mocks.fetchMutation.mockRejectedValue(new Error("PRO_REQUIRED"));

    const result = await updateForwardingAddress(
      initialState,
      formData({ intent: "remove", email: "receipts@example.com" }),
    );

    expect(result).toEqual({
      status: "error",
      intent: "remove",
      message: "Upgrade to Pro to change these settings.",
    });
  });
});
