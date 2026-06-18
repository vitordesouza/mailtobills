import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/types";

import type { MonthInfo } from "../months";
import { isInMonthRange } from "../months";

type ConvexAttachment = {
  _id: string;
  expenseDocumentId: string;
  originalFilename: string;
  mimeType?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  fileStorageId?: string | null;
  attachmentId?: string | null;
  originalOrder: number;
  createdAt: number;
};

type ConvexExpenseDocument = {
  _id: string;
  userId: string;
  fromEmail?: string | null;
  subject?: string | null;
  messageId?: string | null;
  receivedAt: number;
  createdAt: number;
  deletedAt?: number | null;
  dedupeKey: string;
  primaryAttachmentId?: string | null;
  originFromEmail?: string | null;
  originFromName?: string | null;
  originDomain?: string | null;
  originSubject?: string | null;
  originSentAt?: number | null;
  attachments: ConvexAttachment[];
  primaryAttachment?: ConvexAttachment | null;
};

function toAttachment(attachment: ConvexAttachment): ExpenseDocumentAttachment {
  return {
    id: attachment._id,
    expenseDocumentId: attachment.expenseDocumentId,
    originalFilename: attachment.originalFilename,
    mimeType: attachment.mimeType ?? undefined,
    fileSize: attachment.fileSize ?? undefined,
    fileUrl: attachment.fileUrl ?? undefined,
    fileStorageId: attachment.fileStorageId ?? undefined,
    attachmentId: attachment.attachmentId ?? undefined,
    originalOrder: attachment.originalOrder,
    createdAt: attachment.createdAt,
    downloadUrl: `/api/files/${attachment._id}`,
  };
}

export function expenseDocumentRowsForMonth(
  data: ConvexExpenseDocument[],
  monthInfo: MonthInfo,
): ExpenseDocumentRow[] {
  return data
    .filter((document) => isInMonthRange(document.receivedAt, monthInfo))
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .map<ExpenseDocumentRow>((document) => {
      const attachments = document.attachments
        .slice()
        .sort((a, b) => a.originalOrder - b.originalOrder)
        .map((attachment) => toAttachment(attachment));

      const primaryAttachment =
        document.primaryAttachmentId !== undefined
          ? attachments.find(
              (attachment) => attachment.id === document.primaryAttachmentId,
            )
          : undefined;

      return {
        id: document._id,
        userId: document.userId,
        fromEmail: document.fromEmail ?? undefined,
        subject: document.subject ?? undefined,
        messageId: document.messageId ?? undefined,
        receivedAt: document.receivedAt,
        createdAt: document.createdAt,
        deletedAt: document.deletedAt ?? undefined,
        dedupeKey: document.dedupeKey,
        primaryAttachmentId: document.primaryAttachmentId ?? undefined,
        originFromEmail: document.originFromEmail ?? undefined,
        originFromName: document.originFromName ?? undefined,
        originDomain: document.originDomain ?? undefined,
        originSubject: document.originSubject ?? undefined,
        originSentAt: document.originSentAt ?? undefined,
        attachments,
        primaryAttachment:
          primaryAttachment ??
          attachments.find(
            (attachment) =>
              attachment.id === document.primaryAttachment?._id,
          ) ??
          attachments[0],
      };
    });
}

export function summarizeExpenseDocuments(documents: ExpenseDocumentRow[]) {
  const count = documents.length;
  return {
    count,
    attachmentCount: documents.reduce(
      (total, document) => total + document.attachments.length,
      0,
    ),
  };
}

/**
 * Month-over-month change in percent. `null` means there is no prior data
 * to compare against (previous month was empty but this one is not).
 */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
