import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@mailtobills/ui/components/button";

import { signUpUrl } from "@/lib/links";

export async function FinalCta() {
  const t = await getTranslations("FinalCta");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-6 py-14 text-center shadow-xl sm:px-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,oklch(0.55_0.09_160/0.45)_0%,transparent_70%)]"
        />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-primary-foreground/80 text-pretty">
            {t("description")}
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              typography="mono"
              className="bg-background text-foreground hover:bg-background/90 mt-2"
            >
              <a href={signUpUrl}>
                {t("cta")}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
          <p className="text-primary-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}
