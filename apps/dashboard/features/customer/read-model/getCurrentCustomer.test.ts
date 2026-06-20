import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheResetters: [] as Array<() => void>,
  token: vi.fn(),
  fetchQuery: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <Arguments extends unknown[], Result>(
      read: (...args: Arguments) => Result,
    ) => {
      let hasValue = false;
      let value: Result;
      mocks.cacheResetters.push(() => {
        hasValue = false;
      });

      return (...args: Arguments) => {
        if (!hasValue) {
          value = read(...args);
          hasValue = true;
        }
        return value;
      };
    },
  };
});
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: mocks.token,
}));
vi.mock("convex/nextjs", () => ({
  fetchQuery: mocks.fetchQuery,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  getCustomerAuthToken,
  getCurrentCustomer,
  readCurrentCustomer,
  requireCurrentCustomer,
} from "./getCurrentCustomer";

describe("current Customer read model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const reset of mocks.cacheResetters) reset();
  });

  it("does not query Convex without an authenticated token", async () => {
    mocks.token.mockResolvedValue(null);

    await expect(getCurrentCustomer()).resolves.toBeNull();
    expect(mocks.fetchQuery).not.toHaveBeenCalled();
  });

  it("maps the raw Convex user into Customer language", async () => {
    mocks.token.mockResolvedValue("auth-token");
    mocks.fetchQuery.mockResolvedValue({
      _id: "customer-id",
      name: "  Joana  ",
      email: "joana@example.com",
      image: "https://example.com/avatar.png",
      isPro: true,
      forwardingEmails: ["receipts@example.com"],
      accountantEmail: "books@example.com",
      accountantName: "Marta",
      exportScheduleDay: 12,
      locale: "pt-PT",
    });

    await expect(readCurrentCustomer()).resolves.toEqual({
      token: "auth-token",
      customer: {
        id: "customer-id",
        name: "Joana",
        email: "joana@example.com",
        avatarUrl: "https://example.com/avatar.png",
        plan: "pro",
        forwardingAddresses: ["receipts@example.com"],
        accountantAddress: "books@example.com",
        accountantName: "Marta",
        exportScheduleDay: 12,
        locale: "pt-PT",
      },
    });
  });

  it("returns null when a valid token has no matching Customer", async () => {
    mocks.token.mockResolvedValue("auth-token");
    mocks.fetchQuery.mockResolvedValue(null);

    await expect(readCurrentCustomer()).resolves.toBeNull();
    expect(mocks.fetchQuery).toHaveBeenCalledOnce();
  });

  it("deduplicates token and Customer reads across one server render", async () => {
    mocks.token.mockResolvedValue("auth-token");
    mocks.fetchQuery.mockResolvedValue({
      _id: "customer-id",
      name: "Joana",
      email: "joana@example.com",
      isPro: false,
    });

    await Promise.all([getCustomerAuthToken(), getCurrentCustomer()]);

    expect(mocks.token).toHaveBeenCalledOnce();
    expect(mocks.fetchQuery).toHaveBeenCalledOnce();
  });

  it("redirects required Customer reads to sign in", async () => {
    mocks.token.mockResolvedValue(null);

    await expect(requireCurrentCustomer()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/signin");
  });
});
