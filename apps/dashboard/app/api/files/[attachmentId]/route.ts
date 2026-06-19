import { proxyConvexHttpResponse } from "@/lib/convex-http-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const { attachmentId } = await params;
  return proxyConvexHttpResponse({
    pathname: "/file",
    searchParams: { attachmentId },
    fallbackContentType: "application/pdf",
    fallbackContentDisposition: "inline",
  });
}
