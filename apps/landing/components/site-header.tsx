/* eslint-disable @next/next/no-html-link-for-pages -- Locale switches reload root metadata and html lang. */
import { Languages } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@mailtobills/ui/components/button";
import { Logo } from "@mailtobills/ui/components/logo";

import { Link } from "@/i18n/navigation";
import { signInUrl, signUpUrl } from "@/lib/links";

export async function SiteHeader() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Navigation"),
  ]);
  const navLinks = [
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label={t("homeLabel")}
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <Logo className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            MailToBills
          </span>
        </Link>
        <nav
          aria-label={t("primaryLabel")}
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div
            className="border-border flex items-center gap-0.5 border-r pr-2"
            aria-label={t("languageLabel")}
            role="group"
          >
            <Languages
              className="text-muted-foreground mr-1 size-4 max-[420px]:hidden"
              aria-hidden
            />
            <a
              href="/"
              aria-current={locale === "en" ? "page" : undefined}
              className="text-muted-foreground hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground rounded-sm px-1.5 py-1 font-mono text-xs font-semibold"
            >
              EN
            </a>
            <a
              href="/pt-PT"
              aria-current={locale === "pt-PT" ? "page" : undefined}
              className="text-muted-foreground hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground rounded-sm px-1.5 py-1 font-mono text-xs font-semibold"
            >
              PT
            </a>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="max-[359px]:hidden"
          >
            <a href={signInUrl}>{t("signIn")}</a>
          </Button>
          <Button asChild size="sm" typography="mono">
            <a href={signUpUrl}>{t("getStarted")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
