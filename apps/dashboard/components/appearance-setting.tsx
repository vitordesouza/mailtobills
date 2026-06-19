"use client";

import * as React from "react";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@mailtobills/ui/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSetting() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch: theme is only known on the client.
  React.useEffect(() => setMounted(true), []);
  const active = mounted ? (theme ?? "system") : undefined;

  return (
    <div className="bg-muted/40 inline-flex items-center gap-1 rounded-lg border p-1">
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase transition-colors outline-none focus-visible:ring-[3px]",
              isActive
                ? "bg-background text-foreground border shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
