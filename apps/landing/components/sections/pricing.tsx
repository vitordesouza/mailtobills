import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { cn } from "@mailtobills/ui/lib/utils";

import { SectionEyebrow } from "@/components/section-eyebrow";
import { signUpUrl } from "@/lib/links";

export async function Pricing() {
  const t = await getTranslations("Pricing");
  const plans = [
    {
      key: "starter",
      highlighted: false,
      features: [
        t("starter.features.address"),
        t("starter.features.limit"),
        t("starter.features.dashboard"),
        t("starter.features.export"),
      ],
    },
    {
      key: "pro",
      highlighted: true,
      features: [
        t("pro.features.starter"),
        t("pro.features.unlimited"),
        t("pro.features.export"),
        t("pro.features.support"),
        t("pro.features.access"),
      ],
    },
  ] as const;

  return (
    <section id="pricing" className="scroll-mt-14 border-b">
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
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "bg-card relative flex flex-col rounded-xl border p-6 shadow-xs",
                plan.highlighted && "border-primary/40 shadow-md",
              )}
            >
              {plan.highlighted ? (
                <Badge className="absolute -top-2.5 right-6 rounded-full px-2.5 font-mono text-[10px] tracking-[0.08em] uppercase">
                  {t("highlight")}
                </Badge>
              ) : null}
              <h3 className="text-base font-semibold">
                {t(`${plan.key}.name`)}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {t(`${plan.key}.price`)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t(`${plan.key}.period`)}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {t(`${plan.key}.description`)}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                typography="mono"
                className="mt-6 w-full"
              >
                <a href={signUpUrl}>{t(`${plan.key}.cta`)}</a>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-center text-sm">
          {t("note")}
        </p>
      </div>
    </section>
  );
}
