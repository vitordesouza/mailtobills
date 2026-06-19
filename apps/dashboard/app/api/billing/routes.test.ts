import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readCurrentCustomer: vi.fn(),
  fetchQuery: vi.fn(),
  createProCheckout: vi.fn(),
  getCustomerPortalUrlForSubscription: vi.fn(),
}));

vi.mock("@/features/customer/read-model/getCurrentCustomer", () => ({
  readCurrentCustomer: mocks.readCurrentCustomer,
}));
vi.mock("convex/nextjs", () => ({
  fetchQuery: mocks.fetchQuery,
}));
vi.mock("@/lib/lemonsqueezy", () => ({
  createProCheckout: mocks.createProCheckout,
  getCustomerPortalUrlForSubscription:
    mocks.getCustomerPortalUrlForSubscription,
}));

import { POST as createCheckout } from "./checkout/route";
import { GET as openPortal } from "./portal/route";

const session = {
  token: "auth-token",
  customer: {
    id: "customer-id",
    name: "Joana",
    email: "joana@example.com",
    avatarUrl: null,
    plan: "pro" as const,
    forwardingAddresses: [],
    accountantAddress: null,
    accountantName: null,
    exportScheduleDay: null,
  },
};

describe("billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects checkout requests without a current Customer", async () => {
    mocks.readCurrentCustomer.mockResolvedValue(null);

    const response = await createCheckout(
      new Request("https://dashboard.example/settings"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://dashboard.example/signin",
    );
    expect(mocks.createProCheckout).not.toHaveBeenCalled();
  });

  it("creates checkout for the current Customer", async () => {
    mocks.readCurrentCustomer.mockResolvedValue(session);
    mocks.createProCheckout.mockResolvedValue("https://billing.example/buy");

    const response = await createCheckout(
      new Request("https://dashboard.example/settings"),
    );

    expect(mocks.createProCheckout).toHaveBeenCalledWith({
      origin: "https://dashboard.example",
      userId: "customer-id",
      email: "joana@example.com",
      name: "Joana",
    });
    expect(response.headers.get("location")).toBe(
      "https://billing.example/buy",
    );
  });

  it("redirects portal requests without a Subscription", async () => {
    mocks.readCurrentCustomer.mockResolvedValue(session);
    mocks.fetchQuery.mockResolvedValue(null);

    const response = await openPortal(
      new Request("https://dashboard.example/settings"),
    );

    expect(mocks.fetchQuery).toHaveBeenCalledWith(
      expect.anything(),
      {},
      { token: "auth-token" },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://dashboard.example/settings",
    );
  });

  it("opens the current Customer's billing portal", async () => {
    mocks.readCurrentCustomer.mockResolvedValue(session);
    mocks.fetchQuery.mockResolvedValue({
      lemonSqueezySubscriptionId: "subscription-id",
    });
    mocks.getCustomerPortalUrlForSubscription.mockResolvedValue(
      "https://billing.example/portal",
    );

    const response = await openPortal(
      new Request("https://dashboard.example/settings"),
    );

    expect(mocks.getCustomerPortalUrlForSubscription).toHaveBeenCalledWith(
      "subscription-id",
    );
    expect(response.headers.get("location")).toBe(
      "https://billing.example/portal",
    );
  });
});
