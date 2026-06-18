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
  ChevronRight,
  ExternalLink,
  FileText,
  Star,
  Trash2,
} from "lucide-react";

import { api } from "@/lib/convexClient";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";
import { SectionLabel } from "@mailtobills/ui/components/section-label";
import { Skeleton } from "@mailtobills/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mailtobills/ui/components/table";
import { cn } from "@mailtobills/ui/lib/utils";

const getSenderEmail = (document: ExpenseDocumentRow) =>
  document.originFromEmail ?? document.fromEmail;

const getSenderName = (document: ExpenseDocumentRow) => {
  const originName = document.originFromName?.trim();
  if (originName) return originName;

  const email = getSenderEmail(document);
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

const tableColumns = (
  <colgroup>
    <col className="w-[52px]" />
    <col className="w-[220px]" />
    <col />
    <col className="w-[150px]" />
    <col className="w-[120px]" />
    <col className="w-[190px]" />
  </colgroup>
);

function TableHeading({
  count,
}: {
  count?: number;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-0.5">
        <SectionLabel withRule={false} className="text-foreground">
          Collected Expense Documents
        </SectionLabel>
        <p className="text-muted-foreground text-xs">
          One row per accepted forwarded email.
        </p>
      </div>
      {count !== undefined ? (
        <div className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase tabular-nums">
          {count} {count === 1 ? "doc" : "docs"}
        </div>
      ) : null}
    </div>
  );
}

const monoHeadClass = "font-mono text-[11px] tracking-[0.08em] uppercase";

function DocumentsTableHeader() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="sr-only">Expand</TableHead>
        <TableHead className={monoHeadClass}>Sender</TableHead>
        <TableHead className={monoHeadClass}>Document</TableHead>
        <TableHead className={cn(monoHeadClass, "border-l")}>
          Received
        </TableHead>
        <TableHead className={cn(monoHeadClass, "border-l")}>PDFs</TableHead>
        <TableHead className={cn(monoHeadClass, "border-l text-right")}>
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
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

  const runAction = (id: string, action: () => Promise<unknown>) => {
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
        <CardContent className="p-0">
          <EmptyState>
            <EmptyStateIcon>
              <FileText />
            </EmptyStateIcon>
            <EmptyStateTitle>No documents</EmptyStateTitle>
            <EmptyStateDescription>{emptyLabel}</EmptyStateDescription>
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <TableHeading count={documents.length} />
      <CardContent className="p-0">
        <Table className="min-w-[920px] table-fixed">
          {tableColumns}
          <DocumentsTableHeader />
          <TableBody>
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
                  <TableRow
                    data-state={isExpanded ? "selected" : undefined}
                    className={cn(isExpanded && "border-b-0")}
                  >
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : document.id)
                        }
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? "Collapse attachments"
                            : "Expand attachments"
                        }
                      >
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform duration-200",
                            isExpanded && "rotate-90",
                          )}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold shadow-xs">
                          {sender.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{sender}</div>
                          <div
                            className="text-muted-foreground truncate text-xs"
                            title={
                              document.originFromEmail && document.fromEmail
                                ? `Forwarded by ${document.fromEmail}`
                                : undefined
                            }
                          >
                            {getSenderEmail(document) ?? "Forwarded email"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="truncate font-medium">
                          {primary?.originalFilename ?? "No primary PDF"}
                        </div>
                        {primary ? (
                          <Badge variant="warning">Primary</Badge>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {document.subject ?? "No email subject"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground border-l font-mono text-xs whitespace-nowrap tabular-nums">
                      <div>{formatReceivedAt(document.receivedAt)}</div>
                      {document.originSentAt ? (
                        <div className="text-muted-foreground/70 text-[11px]">
                          Sent {formatReceivedAt(document.originSentAt)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="border-l">
                      <Badge
                        variant="outline"
                        className="min-w-7 justify-center tabular-nums"
                      >
                        {document.attachments.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-l text-right">
                      <div className="flex justify-end gap-2">
                        <ViewPdfButton attachment={primary} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
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
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow
                      key={`${document.id}-attachments`}
                      className="hover:bg-transparent"
                    >
                      <TableCell colSpan={6} className="bg-muted/25 px-4 py-3">
                        <div className="animate-in fade-in slide-in-from-top-1 space-y-2 pl-0 duration-200 sm:pl-[52px]">
                          {document.attachments.map((attachment) => {
                            const isPrimary = attachment.id === primary?.id;
                            const fileSize = formatFileSize(
                              attachment.fileSize,
                            );

                            return (
                              <div
                                key={attachment.id}
                                className={cn(
                                  "bg-background flex flex-col gap-3 rounded-md border px-3 py-2 shadow-xs transition-colors sm:flex-row sm:items-center sm:justify-between",
                                  isPrimary &&
                                    "border-amber-500/30 bg-amber-500/5",
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={cn(
                                      "bg-muted/30 flex size-8 shrink-0 items-center justify-center rounded-md border",
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
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ExpenseDocumentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <TableHeading />
      <CardContent className="p-0">
        <Table className="min-w-[920px] table-fixed">
          {tableColumns}
          <DocumentsTableHeader />
          <TableBody>
            {Array.from({ length: rows }).map((_, idx) => (
              <TableRow key={idx} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="size-8 rounded-md" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[22rem] max-w-full" />
                    <Skeleton className="h-3 w-[18rem] max-w-full" />
                  </div>
                </TableCell>
                <TableCell className="border-l">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="border-l">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="border-l">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
