import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  token: "auth-token" as string | null,
}));

vi.mock("@/features/customer/read-model/getCurrentCustomer", () => ({
  readCustomerAuthToken: vi.fn(() => Promise.resolve(auth.token)),
}));

describe("file download API route", () => {
  const originalConvexHttpUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
  const originalConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  beforeEach(() => {
    auth.token = "auth-token";
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL = "https://convex.example.site";
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    vi.restoreAllMocks();
  });

  it("returns unauthorized without an auth token", async () => {
    auth.token = null;
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ attachmentId: "attachment-1" }),
    });

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("proxies successful file responses with safe headers", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response("pdf-bytes", {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": 'inline; filename="invoice.pdf"',
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ attachmentId: "attachment 1" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://convex.example.site/file?attachmentId=attachment+1"),
      {
        headers: {
          authorization: "Bearer auth-token",
        },
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="invoice.pdf"',
    );
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=0, must-revalidate",
    );
    expect(await response.text()).toBe("pdf-bytes");
  });

  it("derives the Convex HTTP URL from NEXT_PUBLIC_CONVEX_URL", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://project.convex.cloud";
    const fetchMock = vi.fn(() => Promise.resolve(new Response("pdf")));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("./route");

    await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ attachmentId: "attachment-1" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://project.convex.site/file?attachmentId=attachment-1"),
      expect.any(Object),
    );
  });

  it("returns unavailable when the upstream request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );
    const { GET } = await import("./route");

    const response = await GET(new Request("http://dashboard.test"), {
      params: Promise.resolve({ attachmentId: "attachment-1" }),
    });

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("File service unavailable");
    expect(response.headers.get("cache-control")).toBe(
      "private, max-age=0, must-revalidate",
    );
  });

  afterEach(() => {
    if (originalConvexHttpUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
    } else {
      process.env.NEXT_PUBLIC_CONVEX_HTTP_URL = originalConvexHttpUrl;
    }

    if (originalConvexUrl === undefined) {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
    } else {
      process.env.NEXT_PUBLIC_CONVEX_URL = originalConvexUrl;
    }
  });
});
