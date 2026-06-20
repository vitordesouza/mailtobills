"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useState, useTransition } from "react";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/domain";
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
import {
  formatDocumentDate,
  formatFileSize as formatLocalizedFileSize,
} from "@/lib/localized-format";
import { Badge } from "@mailtobills/ui/components/badge";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@mailtobills/ui/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mailtobills/ui/components/table";
import {
  ExpenseDocumentsTableColumns,
  ExpenseDocumentsTableHeader,
  ExpenseDocumentsTableHeading,
} from "./expense-documents-table-chrome";
import { cn } from "@mailtobills/ui/lib/utils";

const getSenderEmail = (document: ExpenseDocumentRow) =>
  document.originFromEmail ?? document.fromEmail;

const getSenderName = (document: ExpenseDocumentRow, unknownSender: string) => {
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
    unknownSender;
  return fallback.length
    ? fallback.charAt(0).toUpperCase() + fallback.slice(1)
    : unknownSender;
};

function ViewPdfButton({
  attachment,
  label,
  children,
}: {
  attachment: ExpenseDocumentAttachment | undefined;
  label: string;
  children: string;
}) {
  const url = attachment?.downloadUrl ?? attachment?.fileUrl;

  if (!url) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ExternalLink className="size-3.5" />
        {label}
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
  const locale = useLocale();
  const t = useTranslations("ExpenseDocuments.table");
  const fileSizeT = useTranslations("ExpenseDocuments.fileSize");
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
            <EmptyStateTitle>{t("emptyTitle")}</EmptyStateTitle>
            <EmptyStateDescription>{emptyLabel}</EmptyStateDescription>
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-lg py-0 shadow-xs">
      <ExpenseDocumentsTableHeading count={documents.length} />
      <CardContent className="p-0">
        <Table className="min-w-[920px] table-fixed">
          <ExpenseDocumentsTableColumns />
          <ExpenseDocumentsTableHeader />
          <TableBody>
            {documents.map((document) => {
              const sender = getSenderName(document, t("unknownSender"));
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
                            ? t("collapseAttachments")
                            : t("expandAttachments")
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
                                ? t("forwardedBy", {
                                    email: document.fromEmail,
                                  })
                                : undefined
                            }
                          >
                            {getSenderEmail(document) ?? t("forwardedEmail")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="truncate font-medium">
                          {primary?.originalFilename ?? t("noPrimaryPdf")}
                        </div>
                        {primary ? (
                          <Badge variant="warning">{t("primary")}</Badge>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {document.subject ?? t("noSubject")}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground border-l font-mono text-xs whitespace-nowrap tabular-nums">
                      <div>{formatDocumentDate(document.receivedAt, locale)}</div>
                      {document.originSentAt ? (
                        <div className="text-muted-foreground/70 text-[11px]">
                          {t("sentDate", {
                            date: formatDocumentDate(
                              document.originSentAt,
                              locale,
                            ) ?? "",
                          })}
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
                        <ViewPdfButton attachment={primary} label={t("viewPdf")}>
                          {t("viewPdf")}
                        </ViewPdfButton>
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
                          aria-label={t("deleteDocument")}
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
                            const fileSize = formatLocalizedFileSize(
                              attachment.fileSize,
                              locale,
                              {
                                kb: (size) => fileSizeT("kb", { size }),
                                mb: (size) => fileSizeT("mb", { size }),
                              },
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
                                      {isPrimary ? t("primaryPdf") : t("pdf")}
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
                                      {t("makePrimary")}
                                    </Button>
                                  ) : null}
                                  <ViewPdfButton
                                    attachment={attachment}
                                    label={t("open")}
                                  >
                                    {t("open")}
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
