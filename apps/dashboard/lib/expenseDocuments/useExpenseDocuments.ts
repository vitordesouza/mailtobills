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

  const totalCount = data?.length ?? 0;

  return {
    documents,
    summary,
    isLoading: data === undefined,
    totalCount,
  };
};
