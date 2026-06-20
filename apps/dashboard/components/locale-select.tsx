"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  isLocale,
  localeLabels,
  supportedLocales,
  type Locale,
} from "@mailtobills/i18n";

import { updateDashboardLocale } from "@/features/customer/actions/updateDashboardLocale";

export function LocaleSelect({
  id,
  label,
  hideLabel = false,
  showFeedback = false,
}: {
  id: string;
  label: string;
  hideLabel?: boolean;
  showFeedback?: boolean;
}) {
  const activeLocale = useLocale();
  const router = useRouter();
  const t = useTranslations("Settings.preferences");
  const [selectedLocale, setSelectedLocale] = useState<Locale>(activeLocale);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedLocale(activeLocale);
  }, [activeLocale]);

  const changeLocale = (value: string) => {
    if (!isLocale(value)) return;

    const previousLocale = selectedLocale;
    setSelectedLocale(value);
    setError(false);
    startTransition(async () => {
      const result = await updateDashboardLocale(value);
      if (result.status === "error") {
        setSelectedLocale(previousLocale);
        setError(true);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <label
        className={hideLabel ? "sr-only" : "text-sm font-medium"}
        htmlFor={id}
      >
        {label}
      </label>
      <select
        id={id}
        value={selectedLocale}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value)}
        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
          </option>
        ))}
      </select>
      {showFeedback && isPending ? (
        <p className="text-muted-foreground text-sm" role="status">
          {t("saving")}
        </p>
      ) : null}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {t("saveError")}
        </p>
      ) : null}
    </div>
  );
}
