import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import "@mailtobills/ui/globals.css";
import { Providers } from "@/components/providers";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1c17" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("Accessibility"),
  ]);

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang={locale} className="overscroll-none" suppressHydrationWarning>
        <body
          className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <a
              href="#main-content"
              className="bg-background text-foreground focus:ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-md px-3 py-2 text-sm font-medium shadow-md focus:translate-y-0 focus:ring-2 focus:outline-none"
            >
              {t("skipToContent")}
            </a>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
