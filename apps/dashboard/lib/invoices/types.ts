import type { ExpenseDocumentRow } from "@mailtobills/types";

export type InvoiceSummary = {
  count: number;
  attachmentCount: number;
};

export type InvoicesResult = {
  invoices: ExpenseDocumentRow[];
  summary: InvoiceSummary;
  isLoading: boolean;
  totalCount: number;
};
