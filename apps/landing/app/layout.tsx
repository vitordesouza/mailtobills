import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import "@mailtobills/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "MailToBills — Stop chasing expense PDFs every month",
    template: "%s · MailToBills",
  },
  description:
    "Forward any invoice, receipt, or fatura to your private MailToBills address. We file it by month and hand your accountant one clean ZIP with every PDF and a CSV manifest.",
  openGraph: {
    title: "MailToBills — Stop chasing expense PDFs every month",
    description:
      "Forward expense PDFs, collect them by month, and export a clean package for your accountant.",
    siteName: "MailToBills",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1c17" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
