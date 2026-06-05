"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import { CheckCircle2, Copy, FilePlus2, Mail } from "lucide-react";

import { api } from "@/lib/convexClient";
import { Button } from "@mailtobills/ui/components/button";
import { Input } from "@mailtobills/ui/components/input";
import { Label } from "@mailtobills/ui/components/label";

export const OnboardingEmptyState = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const createDemoExpenseDocument = useMutation(
    api.expenseDocuments.createDemoExpenseDocument,
  );

  const [isCopied, setIsCopied] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const inboxAddress = "inbox@mailtobills.com";
  const onboardingSteps = [
    "Find an expense PDF in your email.",
    `Forward it to ${inboxAddress}.`,
    "MailToBills stores the accepted PDF for this Collection Month.",
  ];

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(inboxAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy inbox address", error);
    }
  };

  const handleSendTestDocument = () => {
    setIsSendingTest(true);
    createDemoExpenseDocument({})
      .catch((error) => {
        console.error("Failed to create demo expense document", error);
      })
      .finally(() => {
        setIsSendingTest(false);
        router.refresh();
      });
  };

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              First Collection
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Forward your first Expense Document
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Use the Collection Address below. Accepted PDFs will appear here
              grouped by the month MailToBills receives the forwarded email.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-1">
                <Label htmlFor="mailtobills-inbox">
                  Collection Address
                </Label>
                <Input
                  id="mailtobills-inbox"
                  ref={inputRef}
                  value={inboxAddress}
                  readOnly
                  onClick={() => {
                    inputRef.current?.select();
                  }}
                  className="font-mono"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAddress}
                className="w-full sm:w-auto"
              >
                <Copy className="size-4" />
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <ol className="grid gap-3 border-y py-5">
            {onboardingSteps.map((text, index) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-sm font-medium shadow-xs">
                  {index === 2 ? (
                    <CheckCircle2 className="size-4" />
                  ) : index === 1 ? (
                    <Mail className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              type="button"
              onClick={handleSendTestDocument}
              disabled={isSendingTest}
              className="w-full whitespace-nowrap sm:w-auto"
            >
              <FilePlus2 className="size-4" />
              {isSendingTest ? "Sending..." : "Add a demo document"}
            </Button>
            <p className="text-muted-foreground text-sm">
              Use this while email ingestion is being tested end to end.
            </p>
          </div>
        </div>

        <div className="flex min-h-[280px] items-center justify-center border-t bg-[linear-gradient(135deg,var(--muted)_0%,transparent_55%)] p-6 lg:border-l lg:border-t-0">
          <Image
            src="/images/mailtobills-envelope.png"
            alt="Expense document in an envelope"
            width={420}
            height={280}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>
      </div>
    </section>
  );
};
