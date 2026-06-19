"use client";

import { Check, Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { Label } from "@mailtobills/ui/components/label";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme = mounted ? (theme ?? "light") : "light";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
        <div className="space-y-1">
          <Label>Theme</Label>
          <p className="text-muted-foreground text-sm">
            Applies to this browser.
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
          <Label htmlFor="language">Language</Label>
          <p className="text-muted-foreground text-sm">
            Interface copy follows this locale.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="language"
              value="en"
              disabled
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:max-w-xs"
            >
              <option value="en">English</option>
            </select>
            <Badge variant="secondary">
              <Languages className="size-3" />
              Current locale
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Portuguese and other locales can plug into this setting when i18n
            ships.
          </p>
        </div>
      </div>
    </div>
  );
}
