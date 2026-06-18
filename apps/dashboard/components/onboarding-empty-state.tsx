"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import { CheckCircle2, FilePlus2, Mail } from "lucide-react";

import { api } from "@/lib/convexClient";
import { CopyField } from "@/components/copy-field";
import { Button } from "@mailtobills/ui/components/button";
import {
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@mailtobills/ui/components/page-header";
import { SectionLabel } from "@mailtobills/ui/components/section-label";

const inboxAddress = "inbox@mailtobills.com";

const onboardingSteps = [
  "Find an expense PDF in your email.",
  `Forward it to ${inboxAddress}.`,
  "MailToBills stores the accepted PDF for this Collection Month.",
];

export const OnboardingEmptyState = () => {
  const router = useRouter();
  const createDemoExpenseDocument = useMutation(
    api.expenseDocuments.createDemoExpenseDocument,
  );

  const [isSendingTest, setIsSendingTest] = useState(false);

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
    <section className="bg-card animate-in fade-in overflow-hidden rounded-lg border shadow-xs duration-300">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
          <PageHeaderContent className="space-y-2">
            <SectionLabel>First Collection</SectionLabel>
            <PageHeaderTitle className="text-3xl whitespace-normal">
              Forward your first Expense Document
            </PageHeaderTitle>
            <PageHeaderDescription className="max-w-xl text-base">
              Use the Collection Address below. Accepted PDFs will appear here
              grouped by the month MailToBills receives the forwarded email.
            </PageHeaderDescription>
          </PageHeaderContent>

          <div className="bg-sidebar/50 rounded-lg border border-dashed p-4">
            <CopyField
              id="mailtobills-inbox"
              label="Collection Address"
              value={inboxAddress}
            />
          </div>

          <ol className="grid gap-3 border-y py-5">
            {onboardingSteps.map((text, index) => (
              <li key={text} className="flex items-start gap-3">
                <span className="bg-background mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-medium shadow-xs">
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
              typography="mono"
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

        <div className="bg-sidebar flex min-h-[280px] items-center justify-center border-t p-6 lg:border-t-0 lg:border-l">
          <Image
            src="/images/mailtobills-envelope.svg"
            alt="Expense document in an envelope"
            width={896}
            height={512}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>
      </div>
    </section>
  );
};
