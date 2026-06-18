import type {
  CollectionMonthExpenseDocuments,
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/types";

function addDownloadUrl(
  attachment: ExpenseDocumentAttachment,
): ExpenseDocumentAttachment {
  return {
    ...attachment,
    downloadUrl: `/api/files/${attachment.id}`,
  };
}

function addRowDownloadUrls(row: ExpenseDocumentRow): ExpenseDocumentRow {
  const attachments = row.attachments.map(addDownloadUrl);
  const primaryAttachment = row.primaryAttachment
    ? attachments.find(
        (attachment) => attachment.id === row.primaryAttachment?.id,
      ) ??
      addDownloadUrl(row.primaryAttachment)
    : undefined;

  return {
    ...row,
    attachments,
    primaryAttachment,
  };
}

export function addExpenseDocumentDownloadUrls(
  data: CollectionMonthExpenseDocuments,
): CollectionMonthExpenseDocuments {
  return {
    ...data,
    documents: data.documents.map(addRowDownloadUrls),
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
