"use client";

import { Lock, MailPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { api } from "@/lib/convexClient";
import { useMutation } from "convex/react";
import { Button } from "@mailtobills/ui/components/button";
import { Input } from "@mailtobills/ui/components/input";
import { Label } from "@mailtobills/ui/components/label";

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForwardingAddressesForm({
  isPro,
  primaryEmail,
  forwardingEmails,
}: {
  isPro: boolean;
  primaryEmail?: string;
  forwardingEmails: string[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const addForwardingAddress = useMutation(api.users.addForwardingAddress);
  const removeForwardingAddress = useMutation(api.users.removeForwardingAddress);
  const canSubmit = isPro && isPlausibleEmail(email) && !isPending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isPlausibleEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setPendingEmail(email);
    startTransition(() => {
      addForwardingAddress({ email })
        .then(() => {
          setEmail("");
          router.refresh();
        })
        .catch(() => setError("Could not add forwarding address."))
        .finally(() => setPendingEmail(null));
    });
  };

  const remove = (targetEmail: string) => {
    setError(null);
    setPendingEmail(targetEmail);
    startTransition(() => {
      removeForwardingAddress({ email: targetEmail })
        .then(() => router.refresh())
        .catch(() => setError("Could not remove forwarding address."))
        .finally(() => setPendingEmail(null));
    });
  };

  return (
    <div className="space-y-4">
      {!isPro ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          <Lock className="mt-0.5 size-4" />
          <div className="space-y-2">
            <p>
              Additional Forwarding Addresses are available on the Pro Plan.
              Your Primary Forwarding Address keeps working on Free.
            </p>
            <form action="/api/billing/checkout" method="post">
              <Button type="submit" size="sm" variant="outline">
                Upgrade to Pro
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Primary Forwarding Address</Label>
        <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm">
          {primaryEmail ?? "No primary email on file"}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Additional Forwarding Addresses</Label>
        {forwardingEmails.length > 0 ? (
          <div className="divide-y rounded-md border">
            {forwardingEmails.map((forwardingEmail) => (
              <div
                key={forwardingEmail}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{forwardingEmail}</span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!isPro || pendingEmail === forwardingEmail}
                  onClick={() => remove(forwardingEmail)}
                  aria-label={`Remove ${forwardingEmail}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No additional addresses configured.
          </p>
        )}
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        <Input
          type="email"
          value={email}
          disabled={!isPro}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          aria-label="Additional forwarding address"
        />
        <Button type="submit" disabled={!canSubmit}>
          <MailPlus className="size-4" />
          Add
        </Button>
      </form>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
