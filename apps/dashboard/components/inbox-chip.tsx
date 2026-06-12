"use client";

import { useState } from "react";

import { Check, Mail } from "lucide-react";

import { cn } from "@mailtobills/ui/lib/utils";

const inboxAddress = "inbox@mailtobills.com";

export function InboxChip({ className }: { className?: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inboxAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy inbox address", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy collection address"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-medium tracking-[0.06em] uppercase transition-colors outline-none focus-visible:ring-[3px]",
        className,
      )}
    >
      {isCopied ? (
        <Check className="text-primary size-3.5" />
      ) : (
        <Mail className="size-3.5" />
      )}
      {inboxAddress}
    </button>
  );
}
