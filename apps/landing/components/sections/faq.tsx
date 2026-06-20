import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SectionEyebrow } from "@/components/section-eyebrow";

export async function Faq() {
  const t = await getTranslations("Faq");
  const faqKeys = [
    "forward",
    "accountant",
    "files",
    "senders",
    "demo",
  ] as const;

  return (
    <section id="faq" className="scroll-mt-14 border-b">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="space-y-3 text-center">
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {t("title")}
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqKeys.map((key) => (
            <details
              key={key}
              className="bg-card group rounded-lg border px-5 shadow-xs"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {t(`items.${key}.question`)}
                <ChevronDown
                  className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground animate-in fade-in slide-in-from-top-1 pb-4 text-sm leading-6 duration-200">
                {t(`items.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
