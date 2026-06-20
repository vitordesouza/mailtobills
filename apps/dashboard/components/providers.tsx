"use client";

import * as React from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { useTranslations } from "next-intl";

import { convexClient, isConvexConfigured } from "../lib/convexClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const t = useTranslations("System");

  if (!convexClient || !isConvexConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md space-y-2 text-center">
          <p className="text-lg font-semibold">{t("convexNotConfigured")}</p>
          <p className="text-sm text-gray-700">{t("convexInstructions")}</p>
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
