import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  token: "auth-token" as string | null,
}));

vi.mock("@/features/customer/read-model/getCurrentCustomer", () => ({
  readCustomerAuthToken: vi.fn(() => Promise.resolve(auth.token)),
}));

describe("accountant export API route", () => {
  const originalConvexHttpUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;

  beforeEach(() => {
    auth.token = "auth-token";
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL = "https://convex.example.site";
    vi.restoreAllMocks();
  });

  it("rejects invalid collection months before calling Convex", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ month: "2026-13" }),
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid Collection Month");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns unauthorized without an auth token", async () => {
    auth.token = null;
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ month: "2026-01" }),
    });

    expect(response.status).toBe(401);
  });

  it("proxies successful export responses with fallback headers", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response("zip-bytes")));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ month: "2026-01" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://convex.example.site/export?month=2026-01",
      {
        headers: {
          authorization: "Bearer auth-token",
        },
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain;charset=UTF-8",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="mailtobills-2026-01.zip"',
    );
    expect(await response.text()).toBe("zip-bytes");
  });

  afterEach(() => {
    if (originalConvexHttpUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
    } else {
      process.env.NEXT_PUBLIC_CONVEX_HTTP_URL = originalConvexHttpUrl;
    }
  });
});
