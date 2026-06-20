import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, supportedLocales } from "@mailtobills/i18n";

import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);
const landingPagePaths = new Set([
  "/",
  ...supportedLocales
    .filter((locale) => locale !== defaultLocale)
    .map((locale) => `/${locale}`),
]);

export default function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  const pathname = request.nextUrl.pathname;
  const isLandingPage = landingPagePaths.has(pathname);

  if (isLandingPage || (response.status >= 300 && response.status < 400)) {
    return response;
  }

  return new NextResponse(response.body, {
    headers: response.headers,
    status: 404,
    statusText: "Not Found",
  });
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
