"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Send } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@mailtobills/convex/_generated/api";

import { Button } from "@mailtobills/ui/components/button";

type SendToAccountantButtonProps = {
  month: string;
  isPro: boolean;
  accountantEmail?: string;
};

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("ACCOUNTANT_EMAIL_NOT_CONFIGURED")) {
    return "Configure an Accountant Address before sending.";
  }

  if (message.includes("PRO_REQUIRED")) {
    return "Upgrade to Pro to send Accountant Exports.";
  }

  if (message.includes("RESEND_API_KEY is not set")) {
    return "Email sending is not configured yet.";
  }

  if (message.includes("RESEND_SEND_FAILED")) {
    return "The email provider could not send this export.";
  }

  return "Could not send this export. ZIP download is still available.";
}

export function SendToAccountantButton({
  month,
  isPro,
  accountantEmail,
}: SendToAccountantButtonProps) {
  const sendManualExportToAccountant = useAction(
    api.exports.sendManualExportToAccountant,
  );
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isPro) {
    return (
      <p className="text-muted-foreground text-sm">
        Accountant Export is available on Pro.{" "}
        <Link className="font-medium underline underline-offset-4" href="/settings">
          Upgrade in settings
        </Link>
        .
      </p>
    );
  }

  if (!accountantEmail) {
    return (
      <p className="text-muted-foreground text-sm">
        No accountant configured.{" "}
        <Link className="font-medium underline underline-offset-4" href="/settings">
          Configure accountant first
        </Link>
        .
      </p>
    );
  }

  const sendExport = () => {
    setError(null);
    setSentTo(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSending(true);

    void sendManualExportToAccountant({ month })
      .then((result) => {
        setSentTo(result.sentTo);
        timeoutRef.current = setTimeout(() => setSentTo(null), 4000);
      })
      .catch((sendError: unknown) => {
        setError(errorMessage(sendError));
      })
      .finally(() => setIsSending(false));
  };

  if (sentTo) {
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <Check className="mr-1.5 inline size-4" />
        Sent to {sentTo}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        typography="mono"
        className="w-full md:w-auto"
        disabled={isSending}
        onClick={sendExport}
      >
        {isSending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Send to accountant
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
