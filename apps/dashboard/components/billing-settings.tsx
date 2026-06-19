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
import { useEffect, useState } from "react";

import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";

type SubscriptionStatus = "active" | "past_due" | "cancelled";

function formatDate(timestamp: number | undefined) {
  if (!timestamp) return null;

  return new Intl.DateTimeFormat("en-US", {
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const renewalDate = formatDate(currentPeriodEnd);
  const isPastDue = subscriptionStatus === "past_due";
  const isProLike = isPro || isPastDue;
  const proFeatures = [
    {
      label: "Additional Forwarding Addresses",
      description: "Collect from more than the Primary Forwarding Address.",
      icon: MailPlus,
    },
    {
      label: "Direct Accountant Export sending",
      description: "Send the ZIP and Manifest to the Accountant Address.",
      icon: Send,
    },
    {
      label: "Export Schedule",
      description: "Deliver the previous Collection Month automatically.",
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
          <span>
            {isProLike
              ? "Welcome to Pro. Direct send, Export Schedule, and Additional Forwarding Addresses are now unlocked."
              : "Checkout completed. Waiting for the Lemon Squeezy subscription webhook to confirm Pro access."}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {isPastDue
                ? "Your Pro Plan is paused"
                : isPro
                  ? "You are on the Pro Plan"
                  : "You are on the Free Plan"}
            </span>
            <Badge
              variant={isPastDue ? "warning" : isPro ? "success" : "secondary"}
            >
              {isPastDue ? "Past due" : isPro ? "Pro" : "Free"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {isPastDue
              ? "Update your payment method to resume Pro features."
              : isPro
                ? renewalDate
                  ? `Renews ${renewalDate}.`
                  : "Your Pro subscription is active."
                : "Manual ZIP download is included for free."}
          </p>
        </div>

        {isProLike ? (
          <Button asChild variant="outline">
            <a href="/api/billing/portal">
              <CreditCard className="size-4" />
              {isPastDue ? "Update payment method" : "Manage billing"}
            </a>
          </Button>
        ) : (
          <form action="/api/billing/checkout" method="post">
            <Button type="submit">
              <CreditCard className="size-4" />
              Upgrade to Pro
            </Button>
          </form>
        )}
      </div>

      {isPastDue ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4" />
          <span>
            Your last payment failed. Update your payment method to keep Pro
            features active.
          </span>
        </div>
      ) : null}

      {!isProLike ? (
        <div className="grid gap-3 text-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-md border bg-muted/30 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">Free Plan</div>
              <Badge variant="secondary">Current</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Unlimited collection, dashboard browsing, and manual Accountant
              Export ZIP download.
            </p>
          </div>
          <div className="divide-y rounded-md border border-primary/25 bg-primary/5">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <div>
                <div className="font-medium">Pro Plan</div>
                <p className="text-muted-foreground text-xs">
                  Removes the repeated month-end handoff work.
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
                {isPastDue ? "Paused" : "Active"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
