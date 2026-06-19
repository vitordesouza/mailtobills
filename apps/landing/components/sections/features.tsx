import {
  CalendarDays,
  FileArchive,
  Inbox,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SectionEyebrow } from "@/components/section-eyebrow";

export async function Features() {
  const t = await getTranslations("Features");
  const features = [
    { icon: CalendarDays, key: "monthly" },
    { icon: Star, key: "primary" },
    { icon: FileArchive, key: "export" },
    { icon: ShieldCheck, key: "trusted" },
    { icon: Inbox, key: "inbox" },
    { icon: Zap, key: "install" },
  ] as const;

  return (
    <section id="features" className="bg-sidebar/60 scroll-mt-14 border-b">
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
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-card hover:border-ring/40 rounded-lg border p-6 shadow-xs transition-colors"
            >
              <span className="bg-muted/40 flex size-10 items-center justify-center rounded-lg border">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {t(`items.${key}.copy`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
