"use client";

import { useMemo } from "react";

import { useQuery } from "convex/react";
import { api } from "@/lib/convexClient";
import { addExpenseDocumentDownloadUrls } from "./transform";
import type { ExpenseDocumentsResult } from "./types";

export type UseExpenseDocumentsResult = ExpenseDocumentsResult;

const emptyResult = {
  documents: [],
  summary: { count: 0, attachmentCount: 0 },
  previousSummary: { count: 0, attachmentCount: 0 },
  exportSummary: {
    includedDocumentCount: 0,
    pdfFileCount: 0,
    manifestFileCount: 1,
    fileCount: 1,
    skippedDocumentCount: 0,
    skippedDocuments: [],
  },
  previousExportSummary: {
    includedDocumentCount: 0,
    pdfFileCount: 0,
    manifestFileCount: 1,
    fileCount: 1,
    skippedDocumentCount: 0,
    skippedDocuments: [],
  },
  totalCount: 0,
} satisfies Omit<ExpenseDocumentsResult, "isLoading">;

export const useExpenseDocuments = (
  month: string,
): UseExpenseDocumentsResult => {
  const data = useQuery(api.expenseDocuments.getCollectionMonthDashboard, {
    month,
  });
  const result = useMemo(
    () => (data ? addExpenseDocumentDownloadUrls(data) : emptyResult),
    [data],
  );

  return {
    ...result,
    isLoading: data === undefined,
  };
};
