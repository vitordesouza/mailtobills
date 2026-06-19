"use client";

import { CalendarClock, CheckCircle2, Lock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { api } from "@/lib/convexClient";
import { useMutation } from "convex/react";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { Input } from "@mailtobills/ui/components/input";
import { Label } from "@mailtobills/ui/components/label";

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function nextExportPreview(today: Date, scheduleDay: number) {
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

  return `Next export (UTC): ${new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(sendDate)}, covering ${monthLabel(coveringMonth)}`;
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
  const router = useRouter();
  const [email, setEmail] = useState(accountantEmail ?? "");
  const [name, setName] = useState(accountantName ?? "");
  const [day, setDay] = useState(exportScheduleDay ?? 5);
  const [enabled, setEnabled] = useState(exportScheduleDay !== undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const updateAccountantDeliverySettings = useMutation(
    api.users.updateAccountantDeliverySettings,
  );
  const updateExportSchedule = useMutation(api.users.updateExportSchedule);
  const emailIsValid = isPlausibleEmail(email);
  const preview = useMemo(
    () => (enabled && emailIsValid ? nextExportPreview(new Date(), day) : null),
    [day, emailIsValid, enabled],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (email.trim() && !emailIsValid) {
      setError("A valid Accountant Address is required.");
      return;
    }

    if (enabled && !emailIsValid) {
      setError(
        "A valid Accountant Address is required to enable the schedule.",
      );
      return;
    }

    startTransition(() => {
      updateAccountantDeliverySettings({
        accountantEmail: email,
        accountantName: name,
        exportScheduleDay: enabled ? day : undefined,
      })
        .then(() => {
          setMessage(
            enabled ? "Export Schedule saved." : "Export Schedule disabled.",
          );
          router.refresh();
        })
        .catch((caught) => {
          if (
            caught instanceof Error &&
            caught.message.includes("PRO_REQUIRED")
          ) {
            setError("Upgrade to Pro to configure Export Schedule.");
            return;
          }
          if (
            caught instanceof Error &&
            caught.message.includes(
              "ACCOUNTANT_ADDRESS_REQUIRED_FOR_EXPORT_SCHEDULE",
            )
          ) {
            setError(
              "A valid Accountant Address is required to enable the schedule.",
            );
            return;
          }
          setError("Could not save Export Schedule.");
        });
    });
  };

  const disableSchedule = () => {
    setMessage(null);
    setError(null);
    startTransition(() => {
      updateExportSchedule({
        exportScheduleDay: undefined,
      })
        .then(() => {
          setEnabled(false);
          setMessage("Export Schedule disabled.");
          router.refresh();
        })
        .catch(() => setError("Could not disable Export Schedule."));
    });
  };

  return (
    <div className="space-y-4">
      {!isPro ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm text-amber-800 dark:text-amber-200">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-medium">
                Pro turns month-end handoff into a saved delivery route.
              </p>
              <p>
                Send Accountant Exports directly to the Accountant Address and
                schedule monthly delivery for the previous Collection Month.
              </p>
            </div>
            <form action="/api/billing/checkout" method="post">
              <Button type="submit" size="sm" variant="outline">
                Upgrade to Pro
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Send className="size-4" />
            Direct Accountant Export sending is unlocked.
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Export Schedule settings are preserved.
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountant-email">Accountant Address</Label>
            <Input
              id="accountant-email"
              type="email"
              value={email}
              disabled={!isPro}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="accountant@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountant-name">Accountant Name</Label>
            <Input
              id="accountant-name"
              type="text"
              value={name}
              disabled={!isPro}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Dra. Marta Silva"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="export-day">Send on day (UTC)</Label>
            <select
              id="export-day"
              value={day}
              disabled={!isPro || !emailIsValid}
              onChange={(event) => setDay(Number(event.target.value))}
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
              checked={enabled}
              disabled={!isPro || !emailIsValid}
              onChange={(event) => setEnabled(event.target.checked)}
              className="size-4"
            />
            Enable monthly Export Schedule
            <Badge variant={enabled ? "success" : "secondary"}>
              {enabled ? "On" : "Off"}
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
          <Button type="submit" disabled={!isPro || isPending}>
            Save Export Schedule
          </Button>
          {enabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={!isPro || isPending}
              onClick={disableSchedule}
            >
              Disable
            </Button>
          ) : null}
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </form>
    </div>
  );
}
