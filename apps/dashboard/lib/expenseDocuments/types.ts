import type {
  AccountantExportContentSummary,
  ExpenseDocumentRow,
} from "@mailtobills/types";

export type ExpenseDocumentSummary = {
  count: number;
  attachmentCount: number;
};

export type ExpenseDocumentsResult = {
  documents: ExpenseDocumentRow[];
  summary: ExpenseDocumentSummary;
  previousSummary: ExpenseDocumentSummary;
  exportSummary: AccountantExportContentSummary;
  previousExportSummary: AccountantExportContentSummary;
  isLoading: boolean;
  totalCount: number;
};
