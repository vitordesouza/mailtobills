"use client";

import { useRef, useState } from "react";

import { Check, Copy } from "lucide-react";

import { Button } from "@mailtobills/ui/components/button";
import { Input } from "@mailtobills/ui/components/input";
import { Label } from "@mailtobills/ui/components/label";
import { cn } from "@mailtobills/ui/lib/utils";

export function CopyField({
  id,
  label,
  value,
  className,
  copyLabel = "Copy",
  copiedLabel = "Copied",
}: {
  id: string;
  label: string;
  value: string;
  className?: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy value", error);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="grid w-full max-w-sm gap-1">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          ref={inputRef}
          value={value}
          readOnly
          onClick={() => inputRef.current?.select()}
          className="bg-background font-mono"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="w-full sm:w-auto"
      >
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {isCopied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}
