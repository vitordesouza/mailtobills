"use client";

import { CheckCircle2, Clock3, CreditCard, TriangleAlert } from "lucide-react";
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
              ? "Welcome to Pro. Export Schedule and Additional Forwarding Addresses are now unlocked."
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
            <Badge variant={isPastDue ? "warning" : isPro ? "success" : "secondary"}>
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
              : "Manual Accountant Export is included for free."}
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
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded-md border px-3 py-2">
            <div className="font-medium">Free</div>
            <p className="text-muted-foreground">
              Unlimited collection, dashboard browsing, and manual Accountant
              Export.
            </p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="font-medium">Pro</div>
            <p className="text-muted-foreground">
              Adds Export Schedule and Additional Forwarding Addresses.
            </p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {proPriceLabel}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
