"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/types";
import type { Id } from "@mailtobills/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ChevronDown, ChevronRight, FileText, Trash2 } from "lucide-react";

import { api } from "@/lib/convexClient";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import { Skeleton } from "@mailtobills/ui/components/skeleton";

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
        {children}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm">
      <a href={url} target="_blank" rel="noreferrer">
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
      <Card className="py-0">
        <CardContent className="flex min-h-[340px] flex-col items-center justify-center py-10 text-center">
          <div className="text-sm font-medium">No documents</div>
          <div className="text-muted-foreground mt-1 text-sm">{emptyLabel}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
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
                    <tr
                      className="hover:bg-muted/30 [&>td]:px-4 [&>td]:py-3"
                    >
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
                          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg text-xs font-semibold">
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
                        <div className="truncate font-medium">
                          {primary?.originalFilename ?? "No primary PDF"}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {document.subject ?? "No email subject"}
                        </div>
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap border-l">
                        {formatReceivedAt(document.receivedAt)}
                      </td>
                      <td className="text-muted-foreground border-l">
                        {document.attachments.length}
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
                        <td colSpan={6} className="bg-muted/20 px-4 py-3">
                          <div className="space-y-2 pl-[52px]">
                            {document.attachments.map((attachment) => {
                              const isPrimary = attachment.id === primary?.id;
                              const fileSize = formatFileSize(
                                attachment.fileSize,
                              );

                              return (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <FileText className="text-muted-foreground size-4 shrink-0" />
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
                                  <div className="flex shrink-0 items-center gap-2">
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
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
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
