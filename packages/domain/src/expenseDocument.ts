export type ExpenseDocumentAttachment = {
  id: string;
  expenseDocumentId: string;
  originalFilename: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  fileStorageId?: string;
  attachmentId?: string;
  downloadUrl?: string;
  originalOrder: number;
  createdAt: number;
};

export type ExpenseDocument = {
  id: string;
  userId: string;
  fromEmail?: string;
  subject?: string;
  messageId?: string;
  receivedAt: number;
  createdAt: number;
  deletedAt?: number;
  dedupeKey: string;
  primaryAttachmentId?: string;
  originFromEmail?: string;
  originFromName?: string;
  originDomain?: string;
  originSubject?: string;
  originSentAt?: number;
};

export type ExpenseDocumentRow = ExpenseDocument & {
  attachments: ExpenseDocumentAttachment[];
  primaryAttachment?: ExpenseDocumentAttachment;
};

export type ExpenseDocumentSummary = {
  count: number;
  attachmentCount: number;
};

export type CollectionMonthExpenseDocuments = {
  documents: ExpenseDocumentRow[];
  summary: ExpenseDocumentSummary;
  previousSummary: ExpenseDocumentSummary;
  exportSummary: import("./accountantExportContents.js").AccountantExportContentSummary;
  previousExportSummary: import("./accountantExportContents.js").AccountantExportContentSummary;
  totalCount: number;
};
