import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  customer: vi.fn(),
  getCookie: vi.fn(),
}));

vi.mock("@/features/customer/read-model/getCurrentCustomer", () => ({
  getCurrentCustomer: mocks.customer,
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.getCookie })),
}));

import { resolveDashboardLocale } from "./locale";

describe("dashboard locale resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.customer.mockResolvedValue(null);
    mocks.getCookie.mockReturnValue(undefined);
  });

  it("prefers the authenticated Customer preference", async () => {
    mocks.customer.mockResolvedValue({ customer: { locale: "pt-PT" } });
    mocks.getCookie.mockReturnValue({ value: "en" });

    await expect(resolveDashboardLocale()).resolves.toBe("pt-PT");
  });

  it("uses the cookie before authentication", async () => {
    mocks.getCookie.mockReturnValue({ value: "pt-PT" });

    await expect(resolveDashboardLocale()).resolves.toBe("pt-PT");
  });

  it("falls back to English for unsupported cookies", async () => {
    mocks.getCookie.mockReturnValue({ value: "fr" });

    await expect(resolveDashboardLocale()).resolves.toBe("en");
  });
});
