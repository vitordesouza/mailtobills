"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import Image from "next/image";

import { api } from "@/lib/convexClient";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
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
    "Find an expense PDF in your email",
    `Forward it to ${inboxAddress}`,
    "See it appear here instantly!",
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
        router.refresh();
      });
  };

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid gap-8 p-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Start here
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Get started with MailtoBills
            </h1>
            <p className="text-muted-foreground">
              Forward expense PDFs to the address below to collect them by
              month.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-1">
                <Label htmlFor="mailtobills-inbox">
                  Your MailToBills email
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
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <ol className="grid gap-3">
            {onboardingSteps.map((text, index) => (
              <li key={text} className="flex items-start gap-3">
                <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                  {index + 1}
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
              {isSendingTest ? "Sending..." : "Add a demo document"}
            </Button>
            <p className="text-muted-foreground text-sm">
              No documents yet. Start forwarding expense PDFs to organize them
              for your accountant.
            </p>
          </div>
        </div>

        <div className="bg-muted/30 flex items-center justify-center rounded-xl border p-6">
          <Image
            src="/images/mailtobills-envelope.png"
            alt="Expense document in an envelope"
            width={420}
            height={280}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>
      </CardContent>
    </Card>
  );
};
