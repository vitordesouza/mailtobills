"use client";

import { useMemo } from "react";

import { useQuery } from "convex/react";
import { api } from "@/lib/convexClient";
import { getMonthInfo } from "../months";
import {
  expenseDocumentRowsForMonth,
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

  const totalCount = data?.length ?? 0;

  return {
    documents,
    summary,
    previousSummary,
    isLoading: data === undefined,
    totalCount,
  };
};
