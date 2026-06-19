"use client";

import { useEffect, useRef, useState } from "react";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/domain";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mailtobills/ui/components/alert-dialog";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@mailtobills/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mailtobills/ui/components/dropdown-menu";
import { Separator } from "@mailtobills/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@mailtobills/ui/components/sheet";
import { Skeleton } from "@mailtobills/ui/components/skeleton";
import { cn } from "@mailtobills/ui/lib/utils";

type PreviewState = "loading" | "ready" | "error";

export type ExpenseDocumentDetailPanelProps = {
  open: boolean;
  document: ExpenseDocumentRow | null;
  selectedAttachment: ExpenseDocumentAttachment | null;
  documentIndex: number;
  documentCount: number;
  isBusy?: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectAttachment: (attachmentId: string) => void;
  onMakePrimary: (attachmentId: string) => void;
  onDelete: () => void;
};

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
};

const formatFileSize = (fileSize: number | undefined) => {
  if (!fileSize || fileSize <= 0) return null;
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`;
  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
};

const getAttachmentUrl = (attachment: ExpenseDocumentAttachment | null) =>
  attachment?.downloadUrl ?? attachment?.fileUrl ?? null;

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
        {label}
      </dt>
      <dd className="truncate text-sm" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function ExpenseDocumentDetailPanel({
  open,
  document,
  selectedAttachment,
  documentIndex,
  documentCount,
  isBusy = false,
  onOpenChange,
  onPrevious,
  onNext,
  onSelectAttachment,
  onMakePrimary,
  onDelete,
}: ExpenseDocumentDetailPanelProps) {
  const [previewState, setPreviewState] = useState<PreviewState>("loading");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailDetailsOpen, setEmailDetailsOpen] = useState(false);
  const [sheetContentElement, setSheetContentElement] =
    useState<HTMLDivElement | null>(null);
  const moreActionsRef = useRef<HTMLButtonElement>(null);
  const attachmentUrl = getAttachmentUrl(selectedAttachment);
  const isPrimary = selectedAttachment?.id === document?.primaryAttachment?.id;

  useEffect(() => {
    setPreviewState(attachmentUrl ? "loading" : "error");
  }, [attachmentUrl]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const syncEmailDetails = (event: MediaQueryListEvent | MediaQueryList) => {
      setEmailDetailsOpen(event.matches);
    };

    syncEmailDetails(desktop);
    desktop.addEventListener("change", syncEmailDetails);
    return () => desktop.removeEventListener("change", syncEmailDetails);
  }, []);

  if (!document) return null;

  const title =
    selectedAttachment?.originalFilename ??
    document.primaryAttachment?.originalFilename ??
    "Expense document";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          ref={setSheetContentElement}
          className="w-full gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        >
          <SheetHeader className="gap-4 border-b px-5 pt-5 pb-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 pr-8">
              <p className="text-muted-foreground font-mono text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums">
                Document {documentIndex + 1} of {documentCount}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPrevious}
                  disabled={documentIndex <= 0}
                  aria-label="Previous document"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onNext}
                  disabled={documentIndex >= documentCount - 1}
                  aria-label="Next document"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="min-w-0 pr-8">
              <p className="text-muted-foreground mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
                Collected expense document
              </p>
              <SheetTitle className="truncate text-lg" title={title}>
                {title}
              </SheetTitle>
              <SheetDescription className="truncate">
                {document.originSubject ??
                  document.subject ??
                  "No email subject"}
              </SheetDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {attachmentUrl ? (
                <Button asChild size="sm">
                  <a href={attachmentUrl} download>
                    <Download />
                    Download PDF
                  </a>
                </Button>
              ) : (
                <Button size="sm" disabled>
                  <Download />
                  Download PDF
                </Button>
              )}
              {!isPrimary && selectedAttachment ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => onMakePrimary(selectedAttachment.id)}
                >
                  <Star />
                  Make primary
                </Button>
              ) : null}
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={moreActionsRef}
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isBusy}
                      aria-label="More document actions"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setConfirmDelete(true)}
                    >
                      <Trash2 />
                      Delete document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Collapsible
              open={emailDetailsOpen}
              onOpenChange={setEmailDetailsOpen}
              className="border-b"
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="group h-11 w-full justify-between rounded-none px-5 sm:px-6"
                >
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]">
                    Email details
                  </span>
                  <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 pt-1 pb-5 sm:grid-cols-2 sm:px-6">
                  <MetadataItem
                    label="Original sender"
                    value={
                      document.originFromEmail ??
                      document.originFromName ??
                      "Not available"
                    }
                  />
                  <MetadataItem
                    label="Forwarded by"
                    value={document.fromEmail ?? "Not available"}
                  />
                  <MetadataItem
                    label="Received by MailToBills"
                    value={formatDate(document.receivedAt)}
                  />
                  <MetadataItem
                    label="Original sent date"
                    value={formatDate(document.originSentAt)}
                  />
                </dl>
              </CollapsibleContent>
            </Collapsible>

            <section aria-label="PDF preview" className="space-y-3 p-4 sm:p-6">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate text-sm font-medium">{title}</span>
                  {isPrimary ? <Badge variant="warning">Primary</Badge> : null}
                </div>
                {attachmentUrl ? (
                  <Button asChild variant="ghost" size="sm">
                    <a href={attachmentUrl} target="_blank" rel="noreferrer">
                      Open original
                      <ExternalLink />
                    </a>
                  </Button>
                ) : null}
              </div>

              <div className="bg-muted/30 relative min-h-[420px] overflow-hidden rounded-md border sm:min-h-[560px]">
                {previewState === "loading" ? (
                  <div
                    className="absolute inset-0 z-10 space-y-3 bg-inherit p-4"
                    aria-label="Loading PDF preview"
                  >
                    <Skeleton className="h-full w-full rounded-sm" />
                  </div>
                ) : null}
                {attachmentUrl && previewState !== "error" ? (
                  <iframe
                    key={attachmentUrl}
                    src={attachmentUrl}
                    title={`Preview ${title}`}
                    className="absolute inset-0 size-full bg-white"
                    onLoad={(event) => {
                      const contentType =
                        event.currentTarget.contentDocument?.contentType;
                      setPreviewState(
                        contentType && contentType !== "application/pdf"
                          ? "error"
                          : "ready",
                      );
                    }}
                    onError={() => setPreviewState("error")}
                  />
                ) : null}
                {previewState === "error" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="bg-background flex size-11 items-center justify-center rounded-lg border shadow-xs">
                      <FileText className="text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        Can&apos;t preview this PDF here
                      </p>
                      <p className="text-muted-foreground max-w-sm text-sm">
                        Open the original file or download it to continue.
                      </p>
                    </div>
                    {attachmentUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink />
                          Open original
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            {document.attachments.length > 1 ? (
              <section aria-label="Attachments" className="px-4 pb-6 sm:px-6">
                <Separator className="mb-4" />
                <h3 className="text-muted-foreground mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
                  Attachments
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {document.attachments.map((attachment) => {
                    const attachmentIsPrimary =
                      attachment.id === document.primaryAttachment?.id;
                    const attachmentIsSelected =
                      attachment.id === selectedAttachment?.id;
                    const fileSize = formatFileSize(attachment.fileSize);

                    return (
                      <button
                        key={attachment.id}
                        type="button"
                        className={cn(
                          "bg-background hover:bg-accent focus-visible:ring-ring/50 flex min-w-0 cursor-pointer items-center gap-3 rounded-md border p-3 text-left shadow-xs transition-colors outline-none focus-visible:ring-3",
                          attachmentIsSelected &&
                            "border-foreground/30 bg-accent/50",
                        )}
                        onClick={() => onSelectAttachment(attachment.id)}
                        aria-pressed={attachmentIsSelected}
                        aria-label={`Preview ${attachment.originalFilename}`}
                      >
                        <div
                          className={cn(
                            "bg-muted flex size-9 shrink-0 items-center justify-center rounded-md border",
                            attachmentIsPrimary &&
                              "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                          )}
                        >
                          {attachmentIsPrimary ? <Star /> : <FileText />}
                        </div>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {attachment.originalFilename}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {attachmentIsPrimary ? "Primary PDF" : "PDF"}
                            {fileSize ? ` - ${fileSize}` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <p className="sr-only" aria-live="polite">
            Previewing {title}
          </p>

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent
              portalContainer={sheetContentElement}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                moreActionsRef.current?.focus();
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete this expense document?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the collected email and all its attachments. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isBusy}
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete();
                  }}
                >
                  Delete document
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetContent>
      </Sheet>
    </>
  );
}
