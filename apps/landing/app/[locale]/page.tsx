import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isLocale } from "@mailtobills/i18n";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Faq } from "@/components/sections/faq";
import { Features } from "@/components/sections/features";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Pricing } from "@/components/sections/pricing";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("Accessibility");

  return (
    <div className="landing-page bg-background text-foreground flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="bg-background text-foreground focus:ring-ring sr-only z-[100] rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:outline-none"
      >
        {t("skipToContent")}
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
