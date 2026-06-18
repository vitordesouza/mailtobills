"use client";

import { useMemo } from "react";

import { useQuery } from "convex/react";
import type { AccountantExportContentSummary } from "@mailtobills/types";
import { api } from "@/lib/convexClient";
import { getMonthInfo } from "../months";
import {
  expenseDocumentRowsForMonth,
  summarizeAccountantExportForMonth,
  summarizeExpenseDocuments,
} from "./transform";
import type {
  ExpenseDocumentsResult,
  ExpenseDocumentSummary,
} from "./types";

export type UseExpenseDocumentsResult = ExpenseDocumentsResult;

export const useExpenseDocuments = (
  month: string,
): UseExpenseDocumentsResult => {
  const data = useQuery(api.expenseDocuments.listMine, {});
  const monthInfo = useMemo(() => getMonthInfo(month), [month]);

  const documents = useMemo(() => {
    if (!data) return [];

    return expenseDocumentRowsForMonth(data, monthInfo);
  }, [data, monthInfo]);

  const summary = useMemo<ExpenseDocumentSummary>(() => {
    return summarizeExpenseDocuments(documents);
  }, [documents]);

  const previousSummary = useMemo<ExpenseDocumentSummary>(() => {
    if (!data) return { count: 0, attachmentCount: 0 };

    return summarizeExpenseDocuments(
      expenseDocumentRowsForMonth(data, getMonthInfo(monthInfo.previous)),
    );
  }, [data, monthInfo]);

  const exportSummary = useMemo<AccountantExportContentSummary>(() => {
    if (!data) {
      return {
        includedDocumentCount: 0,
        pdfFileCount: 0,
        manifestFileCount: 1,
        fileCount: 1,
        skippedDocumentCount: 0,
        skippedDocuments: [],
      };
    }

    return summarizeAccountantExportForMonth(data, monthInfo);
  }, [data, monthInfo]);

  const previousExportSummary = useMemo<AccountantExportContentSummary>(() => {
    if (!data) {
      return {
        includedDocumentCount: 0,
        pdfFileCount: 0,
        manifestFileCount: 1,
        fileCount: 1,
        skippedDocumentCount: 0,
        skippedDocuments: [],
      };
    }

    return summarizeAccountantExportForMonth(
      data,
      getMonthInfo(monthInfo.previous),
    );
  }, [data, monthInfo]);

  const totalCount = data?.length ?? 0;

  return {
    documents,
    summary,
    previousSummary,
    exportSummary,
    previousExportSummary,
    isLoading: data === undefined,
    totalCount,
  };
};
