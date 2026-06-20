"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@mailtobills/ui/components/button";
import { Label } from "@mailtobills/ui/components/label";
import { LocaleSelect } from "@/components/locale-select";

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Settings.preferences");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? (theme ?? "light") : "light";
  const themeOptions = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
        <div className="space-y-1">
          <Label>{t("theme")}</Label>
          <p className="text-muted-foreground text-sm">
            {t("themeDescription")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {themeOptions.map(({ value, label, icon: Icon }) => {
            const isSelected = selectedTheme === value;

            return (
              <Button
                key={value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setTheme(value)}
                aria-pressed={isSelected}
                className="justify-between"
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {label}
                </span>
                {isSelected ? <Check className="size-4" /> : null}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
        <div className="space-y-1">
          <Label htmlFor="language">{t("language")}</Label>
          <p className="text-muted-foreground text-sm">
            {t("languageDescription")}
          </p>
        </div>
        <div className="space-y-2">
          <div className="max-w-xs">
            <LocaleSelect
              id="language"
              label={t("language")}
              hideLabel
              showFeedback
            />
          </div>
          <p className="text-muted-foreground text-sm">{t("languageHelp")}</p>
        </div>
      </div>
    </div>
  );
}
