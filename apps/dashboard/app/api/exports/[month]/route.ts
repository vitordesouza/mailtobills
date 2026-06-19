import { isCollectionMonth } from "@mailtobills/domain";

import { readCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";
const getConvexHttpBase = () =>
  process.env.NEXT_PUBLIC_CONVEX_HTTP_URL ??
  process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") ??
  "";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;

  if (!isCollectionMonth(month)) {
    return new Response("Invalid Collection Month", { status: 400 });
  }

  const token = await readCustomerAuthToken();
  const convexHttpBase = getConvexHttpBase();

  if (!token || !convexHttpBase) {
    return new Response("Unauthorized", { status: 401 });
  }

  const response = await fetch(
    `${convexHttpBase}/export?month=${encodeURIComponent(month)}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok || !response.body) {
    return new Response(await response.text(), { status: response.status });
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/zip",
      "content-disposition":
        response.headers.get("content-disposition") ??
        `attachment; filename="mailtobills-${month}.zip"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
