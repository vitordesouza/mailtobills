import type { NextRequest } from "next/server";

import {
  createRouteMatcher,
  nextjsMiddlewareRedirect,
  convexAuthNextjsMiddleware,
  type ConvexAuthNextjsMiddlewareContext,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/signin(.*)",
  "/_next(.*)",
  "/favicon.ico",
  "/images(.*)",
]);

const isSignInRoute = createRouteMatcher(["/signin(.*)"]);

export default convexAuthNextjsMiddleware(
  async (
    request: NextRequest,
    {
      convexAuth,
    }: {
      convexAuth: ConvexAuthNextjsMiddlewareContext;
    }
  ) => {
    if (isSignInRoute(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    if (!isPublicRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/signin");
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
