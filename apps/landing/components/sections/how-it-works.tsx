import { FileArchive, FolderCheck, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SectionEyebrow } from "@/components/section-eyebrow";

export async function HowItWorks() {
  const t = await getTranslations("HowItWorks");
  const steps = [
    { icon: Mail, step: "01", key: "forward" },
    { icon: FolderCheck, step: "02", key: "file" },
    { icon: FileArchive, step: "03", key: "export" },
  ] as const;

  return (
    <section id="how-it-works" className="scroll-mt-14 border-b">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-pretty">
            {t("description")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, key }) => (
            <div
              key={step}
              className="bg-card hover:border-ring/40 rounded-lg border p-6 shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="bg-muted/40 flex size-10 items-center justify-center rounded-lg border">
                  <Icon className="size-5" />
                </span>
                <span className="text-muted-foreground font-mono text-sm font-semibold tabular-nums">
                  {step}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {t(`steps.${key}.copy`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
