import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
    ) => read,
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
  getCurrentCustomer,
  requireCurrentCustomer,
} from "./getCurrentCustomer";

describe("current Customer read model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    });

    await expect(getCurrentCustomer()).resolves.toEqual({
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
      },
    });
  });

  it("redirects required Customer reads to sign in", async () => {
    mocks.token.mockResolvedValue(null);

    await expect(requireCurrentCustomer()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/signin");
  });
});
