import "server-only";

import { readCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";

type ConvexHttpProxyOptions = {
  pathname: "/export" | "/file";
  searchParams: Record<string, string>;
  fallbackContentType: string;
  fallbackContentDisposition: string;
};

const privateResponseHeaders = {
  "cache-control": "private, max-age=0, must-revalidate",
};

function getConvexHttpBase(): string | null {
  const configuredUrl =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site");

  return configuredUrl?.replace(/\/$/, "") || null;
}

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: privateResponseHeaders,
  });
}

export async function proxyConvexHttpResponse({
  pathname,
  searchParams,
  fallbackContentType,
  fallbackContentDisposition,
}: ConvexHttpProxyOptions): Promise<Response> {
  const token = await readCustomerAuthToken();
  if (!token) return errorResponse("Unauthorized", 401);

  const convexHttpBase = getConvexHttpBase();
  if (!convexHttpBase) {
    console.error("Convex HTTP proxy is not configured", { pathname });
    return errorResponse("File service unavailable", 503);
  }

  const upstreamUrl = new URL(pathname, `${convexHttpBase}/`);
  for (const [key, value] of Object.entries(searchParams)) {
    upstreamUrl.searchParams.set(key, value);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Convex HTTP proxy request failed", {
      pathname,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse("File service unavailable", 502);
  }

  if (!upstreamResponse.ok) {
    return errorResponse(
      (await upstreamResponse.text()) || "Upstream request failed",
      upstreamResponse.status,
    );
  }

  if (!upstreamResponse.body) {
    return errorResponse("Upstream response was empty", 502);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "content-type":
        upstreamResponse.headers.get("content-type") ?? fallbackContentType,
      "content-disposition":
        upstreamResponse.headers.get("content-disposition") ??
        fallbackContentDisposition,
      ...privateResponseHeaders,
    },
  });
}
