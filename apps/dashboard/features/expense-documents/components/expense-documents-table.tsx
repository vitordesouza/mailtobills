"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { MouseEventHandler } from "react";
import { Fragment, useState } from "react";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/domain";
import type { Id } from "@mailtobills/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  ChevronRight,
  FileText,
  Star,
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

import { ExpenseDocumentDetailPanel } from "./expense-document-detail-panel";

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
  onClick,
  children,
}: {
  attachment: ExpenseDocumentAttachment | undefined;
  label: string;
  children: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const url = attachment?.downloadUrl ?? attachment?.fileUrl;

  if (!url) {
    return (
      <Button variant="outline" size="sm" disabled>
        <FileText className="size-3.5" />
        {children}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <FileText className="size-3.5" />
      {label}
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<
    string | null
  >(null);
  const [panelTrigger, setPanelTrigger] = useState<HTMLElement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const setPrimaryAttachment = useMutation(
    api.expenseDocuments.setPrimaryAttachment,
  );
  const softDelete = useMutation(api.expenseDocuments.softDelete);

  const runAction = (
    id: string,
    action: () => Promise<unknown>,
    onSuccess?: () => void,
    failureMessage = t("errors.fallback"),
  ) => {
    setPendingId(id);
    setActionError(null);
    void action()
      .then(() => {
        onSuccess?.();
        router.refresh();
      })
      .catch((error: unknown) => {
        console.error("expense_document_action_failed", { id, error });
        setActionError(failureMessage);
      })
      .finally(() => setPendingId(null));
  };

  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId,
  );
  const selectedDocumentIndex = selectedDocument
    ? documents.indexOf(selectedDocument)
    : -1;
  const selectedAttachment =
    selectedDocument?.attachments.find(
      (attachment) => attachment.id === selectedAttachmentId,
    ) ??
    selectedDocument?.primaryAttachment ??
    null;

  const selectDocument = (
    document: ExpenseDocumentRow,
    attachmentId = document.primaryAttachment?.id ?? null,
  ) => {
    setSelectedDocumentId(document.id);
    setSelectedAttachmentId(attachmentId);
    setActionError(null);
  };

  const openDocument = (
    document: ExpenseDocumentRow,
    trigger: HTMLElement,
    attachmentId?: string,
  ) => {
    selectDocument(document, attachmentId);
    setPanelTrigger(trigger);
    setActionError(null);
    setPanelOpen(true);
  };

  const selectDocumentAt = (index: number) => {
    const document = documents[index];
    if (document) selectDocument(document);
  };

  const deleteSelectedDocument = () => {
    if (!selectedDocument) return;

    const nextDocument =
      documents[selectedDocumentIndex + 1] ??
      documents[selectedDocumentIndex - 1];

    runAction(
      selectedDocument.id,
      () =>
        softDelete({
          expenseDocumentId: selectedDocument.id as Id<"expenseDocuments">,
        }),
      () => {
        if (nextDocument) {
          selectDocument(nextDocument);
        } else {
          setPanelOpen(false);
        }
      },
      t("errors.delete"),
    );
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
      {actionError && !panelOpen ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-2 text-sm"
        >
          {actionError}
        </div>
      ) : null}
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
                pendingId === document.id ||
                document.attachments.some(
                  (attachment) => attachment.id === pendingId,
                );

              return (
                <Fragment key={document.id}>
                  <TableRow
                    data-state={isExpanded ? "selected" : undefined}
                    aria-selected={panelOpen && selectedDocumentId === document.id}
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer focus-visible:ring-ring/50 outline-none focus-visible:ring-2 focus-visible:ring-inset",
                      isExpanded && "border-b-0",
                      panelOpen &&
                        selectedDocumentId === document.id &&
                        "bg-accent/50",
                    )}
                    onClick={(event) =>
                      openDocument(document, event.currentTarget)
                    }
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      openDocument(document, event.currentTarget);
                    }}
                  >
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedId(isExpanded ? null : document.id)
                        }}
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
                        <ViewPdfButton
                          attachment={primary}
                          label={t("viewPdf")}
                          onClick={(event) => {
                            event.stopPropagation();
                            openDocument(document, event.currentTarget)
                          }}
                        >
                          {t("viewPdf")}
                        </ViewPdfButton>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow
                      key={`${document.id}-attachments`}
                      className="hover:bg-transparent"
                      onClick={(event) => event.stopPropagation()}
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
                                    onClick={(event) =>
                                      openDocument(
                                        document,
                                        event.currentTarget,
                                        attachment.id,
                                      )
                                    }
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

      <ExpenseDocumentDetailPanel
        open={panelOpen}
        document={selectedDocument ?? null}
        selectedAttachment={selectedAttachment}
        documentIndex={Math.max(selectedDocumentIndex, 0)}
        documentCount={documents.length}
        isBusy={pendingId !== null}
        errorMessage={actionError}
        returnFocusTo={panelTrigger}
        onOpenChange={(open) => {
          if (!open && pendingId !== null) return;
          setPanelOpen(open);
        }}
        onPrevious={() => selectDocumentAt(selectedDocumentIndex - 1)}
        onNext={() => selectDocumentAt(selectedDocumentIndex + 1)}
        onSelectAttachment={setSelectedAttachmentId}
        onMakePrimary={(attachmentId) => {
          if (!selectedDocument) return;
          runAction(
            attachmentId,
            () =>
              setPrimaryAttachment({
                expenseDocumentId:
                  selectedDocument.id as Id<"expenseDocuments">,
                attachmentId: attachmentId as Id<"expenseDocumentAttachments">,
            }),
            undefined,
            t("errors.primary"),
          );
        }}
        onDelete={deleteSelectedDocument}
      />
    </Card>
  );
}
