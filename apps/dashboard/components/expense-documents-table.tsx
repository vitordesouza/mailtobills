"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/types";
import type { Id } from "@mailtobills/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Star,
  Trash2,
} from "lucide-react";

import { api } from "@/lib/convexClient";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import { Skeleton } from "@mailtobills/ui/components/skeleton";
import { cn } from "@mailtobills/ui/lib/utils";

const getSenderName = (document: ExpenseDocumentRow) => {
  const email = document.fromEmail;
  if (email?.includes("@")) {
    const domain = email.split("@")[1]?.split(".")[0];
    if (domain) return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  const fallback =
    document.subject?.trim() ||
    document.primaryAttachment?.originalFilename ||
    "Unknown sender";
  return fallback.length
    ? fallback.charAt(0).toUpperCase() + fallback.slice(1)
    : "Unknown sender";
};

const formatReceivedAt = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));

const formatFileSize = (fileSize: number | undefined) => {
  if (!fileSize || fileSize <= 0) return null;
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`;
  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
};

function ViewPdfButton({
  attachment,
  children = "View PDF",
}: {
  attachment: ExpenseDocumentAttachment | undefined;
  children?: string;
}) {
  const url = attachment?.downloadUrl ?? attachment?.fileUrl;

  if (!url) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ExternalLink className="size-3.5" />
        {children}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm">
      <a href={url} target="_blank" rel="noreferrer">
        <ExternalLink className="size-3.5" />
        {children}
      </a>
    </Button>
  );
}

export function ExpenseDocumentsTable({
  documents,
  emptyLabel,
}: {
  documents: ExpenseDocumentRow[];
  emptyLabel: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const setPrimaryAttachment = useMutation(
    api.expenseDocuments.setPrimaryAttachment,
  );
  const softDelete = useMutation(api.expenseDocuments.softDelete);

  const runAction = (
    id: string,
    action: () => Promise<unknown>,
  ) => {
    setPendingId(id);
    startTransition(() => {
      action()
        .then(() => router.refresh())
        .finally(() => setPendingId(null));
    });
  };

  if (documents.length === 0) {
    return (
      <Card className="rounded-lg py-0 shadow-xs">
        <CardContent className="flex min-h-[340px] flex-col items-center justify-center py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30">
            <FileText className="text-muted-foreground size-5" />
          </div>
          <div className="mt-3 text-sm font-medium">No documents</div>
          <div className="text-muted-foreground mt-1 text-sm">{emptyLabel}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <div className="flex flex-col gap-1 border-b bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Collected Expense Documents</h2>
          <p className="text-muted-foreground text-xs">
            One row per accepted forwarded email.
          </p>
        </div>
        <div className="text-muted-foreground text-xs font-medium">
          {documents.length} {documents.length === 1 ? "document" : "documents"}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-sm">
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[220px]" />
              <col />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className="bg-muted/30 text-muted-foreground">
              <tr className="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-medium">
                <th className="sr-only">Expand</th>
                <th>Sender</th>
                <th>Document</th>
                <th className="border-l">Received</th>
                <th className="border-l">PDFs</th>
                <th className="border-l text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((document) => {
                const sender = getSenderName(document);
                const primary = document.primaryAttachment;
                const isExpanded = expandedId === document.id;
                const isBusy =
                  isPending &&
                  (pendingId === document.id ||
                    document.attachments.some(
                      (attachment) => attachment.id === pendingId,
                    ));

                return (
                  <Fragment key={document.id}>
                    <tr className="transition-colors hover:bg-muted/25 [&>td]:px-4 [&>td]:py-3">
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : document.id)
                          }
                          aria-label={
                            isExpanded
                              ? "Collapse attachments"
                              : "Expand attachments"
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </Button>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg border bg-background text-xs font-semibold shadow-xs">
                            {sender.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{sender}</div>
                            <div className="text-muted-foreground truncate text-xs">
                              {document.fromEmail ?? "Forwarded email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="truncate font-medium">
                            {primary?.originalFilename ?? "No primary PDF"}
                          </div>
                          {primary ? (
                            <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                              Primary
                            </span>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {document.subject ?? "No email subject"}
                        </div>
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap border-l">
                        {formatReceivedAt(document.receivedAt)}
                      </td>
                      <td className="text-muted-foreground border-l">
                        <span className="inline-flex min-w-7 justify-center rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground">
                          {document.attachments.length}
                        </span>
                      </td>
                      <td className="border-l text-right">
                        <div className="flex justify-end gap-2">
                          <ViewPdfButton attachment={primary} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            disabled={isBusy}
                            onClick={() =>
                              runAction(document.id, () =>
                                softDelete({
                                  expenseDocumentId:
                                    document.id as Id<"expenseDocuments">,
                                }),
                              )
                            }
                            aria-label="Delete document"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${document.id}-attachments`}>
                        <td colSpan={6} className="bg-muted/25 px-4 py-3">
                          <div className="space-y-2 pl-0 sm:pl-[52px]">
                            {document.attachments.map((attachment) => {
                              const isPrimary = attachment.id === primary?.id;
                              const fileSize = formatFileSize(
                                attachment.fileSize,
                              );

                              return (
                                <div
                                  key={attachment.id}
                                  className={cn(
                                    "flex flex-col gap-3 rounded-md border bg-background px-3 py-2 shadow-xs sm:flex-row sm:items-center sm:justify-between",
                                    isPrimary &&
                                      "border-amber-500/30 bg-amber-500/5",
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/30",
                                        isPrimary &&
                                          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                      )}
                                    >
                                      {isPrimary ? (
                                        <Star className="size-4" />
                                      ) : (
                                        <FileText className="text-muted-foreground size-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="truncate font-medium">
                                        {attachment.originalFilename}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {isPrimary ? "Primary PDF" : "PDF"}
                                        {fileSize ? ` - ${fileSize}` : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                                    {!isPrimary ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isBusy}
                                        onClick={() =>
                                          runAction(attachment.id, () =>
                                            setPrimaryAttachment({
                                              expenseDocumentId:
                                                document.id as Id<"expenseDocuments">,
                                              attachmentId:
                                                attachment.id as Id<"expenseDocumentAttachments">,
                                            }),
                                          )
                                        }
                                      >
                                        Make primary
                                      </Button>
                                    ) : null}
                                    <ViewPdfButton attachment={attachment}>
                                      Open
                                    </ViewPdfButton>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseDocumentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-sm">
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[220px]" />
              <col />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[190px]" />
            </colgroup>
            <thead className="bg-muted/20 text-muted-foreground">
              <tr className="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-medium">
                <th className="sr-only">Expand</th>
                <th>Sender</th>
                <th>Document</th>
                <th className="border-l">Received</th>
                <th className="border-l">PDFs</th>
                <th className="border-l text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: rows }).map((_, idx) => (
                <tr key={idx} className="[&_td]:px-4 [&_td]:py-3">
                  <td>
                    <Skeleton className="size-8 rounded-md" />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[22rem] max-w-full" />
                      <Skeleton className="h-3 w-[18rem] max-w-full" />
                    </div>
                  </td>
                  <td className="border-l">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="border-l">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="border-l">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="size-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
