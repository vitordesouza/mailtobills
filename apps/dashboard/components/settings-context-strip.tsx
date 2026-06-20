"use client";

import { Check, Copy, Inbox, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@mailtobills/ui/components/button";

export function SettingsContextStrip({
  customerName,
  customerEmail,
  collectionAddress,
}: {
  customerName: string;
  customerEmail?: string;
  collectionAddress: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslations("Settings.context");

  const copyCollectionAddress = async () => {
    try {
      await navigator.clipboard.writeText(collectionAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy Collection Address", error);
    }
  };

  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border px-3 py-3 text-sm shadow-xs md:flex-row md:items-center md:justify-between md:px-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="text-muted-foreground size-4 shrink-0" />
          <div className="min-w-0">
            <span className="sr-only">{t("signedInCustomer")}</span>
            <span className="inline-block max-w-full truncate align-bottom font-medium">
              {customerName}
            </span>
            {customerEmail ? (
              <span className="text-muted-foreground ml-2 inline-block max-w-full truncate align-bottom">
                {customerEmail}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Inbox className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground shrink-0">
            {t("collectionAddress")}
          </span>
          <span className="truncate font-mono text-xs font-medium">
            {collectionAddress}
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copyCollectionAddress}
        className="w-full md:w-auto"
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {isCopied ? t("copied") : t("copyAddress")}
      </Button>
    </div>
  );
}
