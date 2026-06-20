import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: vi.fn(),
  fetchMutation: vi.fn(),
  revalidatePath: vi.fn(),
  setCookie: vi.fn(),
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
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mocks.setCookie })),
}));

import { updateDashboardLocale } from "./updateDashboardLocale";

describe("dashboard locale action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token.mockResolvedValue("auth-token");
    mocks.fetchMutation.mockResolvedValue(undefined);
  });

  it("persists authenticated preferences and the request cookie", async () => {
    await expect(updateDashboardLocale("pt-PT")).resolves.toEqual({
      status: "success",
      locale: "pt-PT",
    });

    expect(mocks.fetchMutation).toHaveBeenCalledWith(
      expect.anything(),
      { locale: "pt-PT" },
      { token: "auth-token" },
    );
    expect(mocks.setCookie).toHaveBeenCalledWith(
      "NEXT_LOCALE",
      "pt-PT",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("uses only the cookie before authentication", async () => {
    mocks.token.mockResolvedValue(null);

    const result = await updateDashboardLocale("pt-PT");

    expect(result.status).toBe("success");
    expect(mocks.fetchMutation).not.toHaveBeenCalled();
    expect(mocks.setCookie).toHaveBeenCalledOnce();
  });

  it("rejects unsupported locale values", async () => {
    await expect(updateDashboardLocale("fr")).resolves.toEqual({
      status: "error",
    });
    expect(mocks.fetchMutation).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});
