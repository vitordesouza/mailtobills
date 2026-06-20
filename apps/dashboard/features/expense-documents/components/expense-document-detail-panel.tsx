"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

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
import {
  formatDocumentDate,
  formatFileSize as formatLocalizedFileSize,
} from "@/lib/localized-format";

type PreviewState = "loading" | "ready" | "error";

export type ExpenseDocumentDetailPanelProps = {
  open: boolean;
  document: ExpenseDocumentRow | null;
  selectedAttachment: ExpenseDocumentAttachment | null;
  documentIndex: number;
  documentCount: number;
  isBusy?: boolean;
  errorMessage?: string | null;
  returnFocusTo?: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectAttachment: (attachmentId: string) => void;
  onMakePrimary: (attachmentId: string) => void;
  onDelete: () => void;
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
  errorMessage,
  returnFocusTo,
  onOpenChange,
  onPrevious,
  onNext,
  onSelectAttachment,
  onMakePrimary,
  onDelete,
}: ExpenseDocumentDetailPanelProps) {
  const locale = useLocale();
  const t = useTranslations("ExpenseDocuments.detail");
  const tableT = useTranslations("ExpenseDocuments.table");
  const fileSizeT = useTranslations("ExpenseDocuments.fileSize");
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
    if (!window.matchMedia) return;

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
    t("fallbackTitle");

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          ref={setSheetContentElement}
          closeDisabled={isBusy}
          className="w-full gap-0 overflow-hidden p-0 sm:max-w-[720px]"
          onEscapeKeyDown={(event) => {
            if (isBusy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isBusy) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo?.focus();
          }}
        >
          <SheetHeader className="gap-4 border-b px-5 pt-5 pb-4 sm:px-6">
            <div className="flex items-center justify-between gap-4 pr-8">
              <p className="text-muted-foreground font-mono text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums">
                {t("documentPosition", {
                  current: documentIndex + 1,
                  total: documentCount,
                })}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPrevious}
                  disabled={isBusy || documentIndex <= 0}
                  aria-label={t("previousDocument")}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onNext}
                  disabled={isBusy || documentIndex >= documentCount - 1}
                  aria-label={t("nextDocument")}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="min-w-0 pr-8">
              <p className="text-muted-foreground mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
                {t("sectionLabel")}
              </p>
              <SheetTitle className="truncate text-lg" title={title}>
                {title}
              </SheetTitle>
              <SheetDescription className="truncate">
                {document.originSubject ??
                  document.subject ??
                  tableT("noSubject")}
              </SheetDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {attachmentUrl ? (
                <Button asChild size="sm">
                  <a href={attachmentUrl} download>
                    <Download />
                    {t("downloadPdf")}
                  </a>
                </Button>
              ) : (
                <Button size="sm" disabled>
                  <Download />
                  {t("downloadPdf")}
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
                  {t("makePrimary")}
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
                      aria-label={t("moreActions")}
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
                      {t("deleteDocument")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
              >
                {errorMessage}
              </div>
            ) : null}
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
                    {t("emailDetails")}
                  </span>
                  <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 pt-1 pb-5 sm:grid-cols-2 sm:px-6">
                  <MetadataItem
                    label={t("originalSender")}
                    value={
                      document.originFromEmail ??
                      document.originFromName ??
                      t("notAvailable")
                    }
                  />
                  <MetadataItem
                    label={t("forwardedBy")}
                    value={document.fromEmail ?? t("notAvailable")}
                  />
                  <MetadataItem
                    label={t("receivedByMailToBills")}
                    value={
                      formatDocumentDate(document.receivedAt, locale) ??
                      t("notAvailable")
                    }
                  />
                  <MetadataItem
                    label={t("originalSentDate")}
                    value={
                      formatDocumentDate(document.originSentAt, locale) ??
                      t("notAvailable")
                    }
                  />
                </dl>
              </CollapsibleContent>
            </Collapsible>

            <section
              aria-label={t("pdfPreview")}
              className="space-y-3 p-4 sm:p-6"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate text-sm font-medium">{title}</span>
                  {isPrimary ? (
                    <Badge variant="warning">{tableT("primary")}</Badge>
                  ) : null}
                </div>
                {attachmentUrl ? (
                  <Button asChild variant="ghost" size="sm">
                    <a href={attachmentUrl} target="_blank" rel="noreferrer">
                      {t("openOriginal")}
                      <ExternalLink />
                    </a>
                  </Button>
                ) : null}
              </div>

              <div className="bg-muted/30 relative min-h-[420px] overflow-hidden rounded-md border sm:min-h-[560px]">
                {previewState === "loading" ? (
                  <div
                    className="absolute inset-0 z-10 space-y-3 bg-inherit p-4"
                    aria-label={t("loadingPreview")}
                  >
                    <Skeleton className="h-full w-full rounded-sm" />
                  </div>
                ) : null}
                {attachmentUrl && previewState !== "error" ? (
                  <iframe
                    key={attachmentUrl}
                    src={attachmentUrl}
                    title={t("previewTitle", { title })}
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
                        {t("previewUnavailableTitle")}
                      </p>
                      <p className="text-muted-foreground max-w-sm text-sm">
                        {t("previewUnavailableDescription")}
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
                          {t("openOriginal")}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            {document.attachments.length > 1 ? (
              <section aria-label={t("attachments")} className="px-4 pb-6 sm:px-6">
                <Separator className="mb-4" />
                <h3 className="text-muted-foreground mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em]">
                  {t("attachments")}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {document.attachments.map((attachment) => {
                    const attachmentIsPrimary =
                      attachment.id === document.primaryAttachment?.id;
                    const attachmentIsSelected =
                      attachment.id === selectedAttachment?.id;
                    const fileSize = formatLocalizedFileSize(
                      attachment.fileSize,
                      locale,
                      {
                        kb: (size) => fileSizeT("kb", { size }),
                        mb: (size) => fileSizeT("mb", { size }),
                      },
                    );

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
                        disabled={isBusy}
                        aria-pressed={attachmentIsSelected}
                        aria-label={t("previewAttachment", {
                          filename: attachment.originalFilename,
                        })}
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
                            {attachmentIsPrimary
                              ? tableT("primaryPdf")
                              : tableT("pdf")}
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
            {t("previewing", { title })}
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
                <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isBusy}
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete();
                  }}
                >
                  {t("deleteDocument")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetContent>
      </Sheet>
    </>
  );
}
