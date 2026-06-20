"use client";

import { CalendarClock, CheckCircle2, Lock, Send } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { localeFormats } from "@mailtobills/i18n";

import {
  updateAccountantDeliverySettings,
  type CustomerSettingsActionState,
} from "@/features/customer/actions/updateCustomerSettings";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { Input } from "@mailtobills/ui/components/input";
import { Label } from "@mailtobills/ui/components/label";

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function nextExportDates(today: Date, scheduleDay: number) {
  const sendDate =
    today.getUTCDate() < scheduleDay
      ? new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), scheduleDay),
        )
      : new Date(
          Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth() + 1,
            scheduleDay,
          ),
        );
  const coveringMonth = new Date(
    Date.UTC(sendDate.getUTCFullYear(), sendDate.getUTCMonth() - 1, 1),
  );

  return { coveringMonth, sendDate };
}

export function ExportScheduleForm({
  isPro,
  accountantEmail,
  accountantName,
  exportScheduleDay,
}: {
  isPro: boolean;
  accountantEmail?: string;
  accountantName?: string;
  exportScheduleDay?: number;
}) {
  const [email, setEmail] = useState(accountantEmail ?? "");
  const locale = useLocale();
  const t = useTranslations("Settings.delivery");
  const [name, setName] = useState(accountantName ?? "");
  const [day, setDay] = useState(exportScheduleDay ?? 5);
  const [enabled, setEnabled] = useState(exportScheduleDay !== undefined);
  const [hasChangedSinceResult, setHasChangedSinceResult] = useState(false);
  const [actionState, formAction, isPending] = useActionState(
    updateAccountantDeliverySettings,
    { status: "idle" } satisfies CustomerSettingsActionState,
  );
  const emailIsValid = isPlausibleEmail(email);
  const preview = useMemo(() => {
    if (!enabled || !emailIsValid) return null;

    const { coveringMonth, sendDate } = nextExportDates(new Date(), day);
    const dateLocale = localeFormats[locale].dateLocale;
    const date = new Intl.DateTimeFormat(dateLocale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
      year: "numeric",
    }).format(sendDate);
    const month = new Intl.DateTimeFormat(dateLocale, {
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(coveringMonth);

    return t("nextExport", { date, month });
  }, [day, emailIsValid, enabled, locale, t]);

  useEffect(() => {
    if (
      actionState.status === "success" &&
      actionState.scheduleEnabled !== undefined
    ) {
      setEnabled(actionState.scheduleEnabled);
    }
  }, [actionState]);

  return (
    <div className="space-y-4">
      {!isPro ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-200">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-medium">{t("lockedTitle")}</p>
              <p>{t("lockedDescription")}</p>
            </div>
            <form action="/api/billing/checkout" method="post">
              <Button type="submit" size="sm" variant="outline">
                {t("upgrade")}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Send className="size-4" />
            {t("directUnlocked")}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {t("schedulePreserved")}
          </div>
        </div>
      )}

      <form
        className="space-y-4"
        action={formAction}
        noValidate
        onSubmit={() => setHasChangedSinceResult(false)}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountant-email">{t("accountantAddress")}</Label>
            <Input
              id="accountant-email"
              name="accountantEmail"
              type="email"
              value={email}
              disabled={!isPro}
              onChange={(event) => {
                setEmail(event.target.value);
                setHasChangedSinceResult(true);
              }}
              placeholder={t("accountantAddressPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountant-name">{t("accountantName")}</Label>
            <Input
              id="accountant-name"
              name="accountantName"
              type="text"
              value={name}
              disabled={!isPro}
              onChange={(event) => {
                setName(event.target.value);
                setHasChangedSinceResult(true);
              }}
              placeholder={t("accountantNamePlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="export-day">{t("sendDay")}</Label>
            <select
              id="export-day"
              name="exportScheduleDay"
              value={day}
              disabled={!isPro || !emailIsValid}
              onChange={(event) => {
                setDay(Number(event.target.value));
                setHasChangedSinceResult(true);
              }}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Array.from({ length: 28 }, (_, index) => index + 1).map(
                (option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ),
              )}
            </select>
          </div>

          <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="scheduleEnabled"
              checked={enabled}
              disabled={!isPro || !emailIsValid}
              onChange={(event) => {
                setEnabled(event.target.checked);
                setHasChangedSinceResult(true);
              }}
              className="size-4"
            />
            {t("enable")}
            <Badge variant={enabled ? "success" : "secondary"}>
              {enabled ? t("on") : t("off")}
            </Badge>
          </label>
        </div>

        {preview ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarClock className="size-4" />
            {preview}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="submit"
            name="intent"
            value="save"
            disabled={!isPro || isPending}
          >
            {t("save")}
          </Button>
          {enabled ? (
            <Button
              type="submit"
              name="intent"
              value="disable"
              variant="outline"
              disabled={!isPro || isPending}
              formNoValidate
            >
              {t("disable")}
            </Button>
          ) : null}
        </div>

        {!isPending &&
        !hasChangedSinceResult &&
        actionState.status === "success" ? (
          <p className="text-sm text-emerald-700" aria-live="polite">
            {actionState.message}
          </p>
        ) : null}
        {!isPending &&
        !hasChangedSinceResult &&
        actionState.status === "error" ? (
          <p className="text-destructive text-sm" role="alert">
            {actionState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
