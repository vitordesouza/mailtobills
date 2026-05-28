import type { ExpenseDocumentRow } from "@mailtobills/types";

export type ExpenseDocumentSummary = {
  count: number;
  attachmentCount: number;
};

export type ExpenseDocumentsResult = {
  documents: ExpenseDocumentRow[];
  summary: ExpenseDocumentSummary;
  isLoading: boolean;
  totalCount: number;
};
