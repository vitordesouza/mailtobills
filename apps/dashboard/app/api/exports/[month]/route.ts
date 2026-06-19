import { isCollectionMonth } from "@mailtobills/domain";

import { proxyConvexHttpResponse } from "@/lib/convex-http-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  const { month } = await params;

  if (!isCollectionMonth(month)) {
    return new Response("Invalid Collection Month", { status: 400 });
  }

  return proxyConvexHttpResponse({
    pathname: "/export",
    searchParams: { month },
    fallbackContentType: "application/zip",
    fallbackContentDisposition: `attachment; filename="mailtobills-${month}.zip"`,
  });
}
