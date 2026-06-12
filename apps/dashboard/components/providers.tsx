"use client";

import * as React from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

import { convexClient, isConvexConfigured } from "../lib/convexClient";

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convexClient || !isConvexConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md space-y-2 text-center">
          <p className="text-lg font-semibold">Convex not configured</p>
          <p className="text-sm text-gray-700">
            Set NEXT_PUBLIC_CONVEX_URL in apps/dashboard/.env.local and restart
            dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <NextThemesProvider
      enableSystem
      attribute="class"
      enableColorScheme
      defaultTheme="light"
      disableTransitionOnChange
    >
      <ConvexAuthNextjsProvider client={convexClient}>
        {children}
      </ConvexAuthNextjsProvider>
    </NextThemesProvider>
  );
}
