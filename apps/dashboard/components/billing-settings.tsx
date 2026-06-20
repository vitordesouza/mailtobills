"use client";

import {
  CheckCircle2,
  Clock3,
  CreditCard,
  MailPlus,
  Send,
  TriangleAlert,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { localeFormats, type Locale } from "@mailtobills/i18n";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";

type SubscriptionStatus = "active" | "past_due" | "cancelled";

function formatDate(timestamp: number | undefined, locale: Locale) {
  if (!timestamp) return null;

  return new Intl.DateTimeFormat(localeFormats[locale].dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function BillingSettings({
  isPro,
  subscriptionStatus,
  currentPeriodEnd,
  proPriceLabel,
}: {
  isPro: boolean;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: number;
  proPriceLabel: string;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Settings.billing");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const renewalDate = formatDate(currentPeriodEnd, locale);
  const isPastDue = subscriptionStatus === "past_due";
  const isProLike = isPro || isPastDue;
  const proFeatures = [
    {
      label: t("features.addressesTitle"),
      description: t("features.addressesDescription"),
      icon: MailPlus,
    },
    {
      label: t("features.directTitle"),
      description: t("features.directDescription"),
      icon: Send,
    },
    {
      label: t("features.scheduleTitle"),
      description: t("features.scheduleDescription"),
      icon: Clock3,
    },
  ];

  useEffect(() => {
    if (searchParams.get("upgraded") !== "1") return;

    setShowUpgradeSuccess(true);
    router.replace(pathname);
  }, [pathname, router, searchParams]);

  return (
    <div className="space-y-4">
      {showUpgradeSuccess ? (
        <div
          className={
            isProLike
              ? "flex items-start gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
              : "flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
          }
        >
          {isProLike ? (
            <CheckCircle2 className="mt-0.5 size-4" />
          ) : (
            <Clock3 className="mt-0.5 size-4" />
          )}
          <span>{isProLike ? t("upgradeConfirmed") : t("upgradePending")}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {isPastDue
                ? t("pausedTitle")
                : isPro
                  ? t("proTitle")
                  : t("freeTitle")}
            </span>
            <Badge
              variant={isPastDue ? "warning" : isPro ? "success" : "secondary"}
            >
              {isPastDue ? t("pastDue") : isPro ? t("pro") : t("free")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {isPastDue
              ? t("pausedDescription")
              : isPro
                ? renewalDate
                  ? t("renews", { date: renewalDate })
                  : t("activeDescription")
                : t("freeDescription")}
          </p>
        </div>

        {isProLike ? (
          <Button asChild variant="outline">
            <a href="/api/billing/portal">
              <CreditCard className="size-4" />
              {isPastDue ? t("updatePayment") : t("manageBilling")}
            </a>
          </Button>
        ) : (
          <form action="/api/billing/checkout" method="post">
            <Button type="submit">
              <CreditCard className="size-4" />
              {t("upgrade")}
            </Button>
          </form>
        )}
      </div>

      {isPastDue ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4" />
          <span>{t("paymentFailed")}</span>
        </div>
      ) : null}

      {!isProLike ? (
        <div className="grid gap-3 text-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-md border bg-muted/30 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{t("freePlan")}</div>
              <Badge variant="secondary">{t("current")}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {t("freePlanDescription")}
            </p>
          </div>
          <div className="divide-y rounded-md border border-primary/25 bg-primary/5">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div>
                <div className="font-medium">{t("proPlan")}</div>
                <p className="text-muted-foreground text-xs">
                  {t("proPlanDescription")}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {proPriceLabel}
              </span>
            </div>
            {proFeatures.map(({ label, description, icon: Icon }) => (
              <div key={label} className="flex gap-3 px-3 py-2.5">
                <Icon className="text-primary mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-medium">{label}</div>
                  <p className="text-muted-foreground text-xs">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="divide-y rounded-md border text-sm">
          {proFeatures.map(({ label, description, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3 px-3 py-2.5">
              <Icon className="text-primary mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{label}</div>
                <p className="text-muted-foreground text-xs">{description}</p>
              </div>
              <Badge variant={isPastDue ? "warning" : "success"}>
                {isPastDue ? t("paused") : t("active")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
