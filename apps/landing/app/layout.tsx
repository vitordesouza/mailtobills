import type { Metadata } from "next";

import "@mailtobills/ui/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "MailToBills",
  description:
    "Forward expense PDFs, collect them by month, and export a package for your accountant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
