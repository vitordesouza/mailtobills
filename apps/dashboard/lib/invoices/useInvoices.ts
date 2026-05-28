"use client";

import { useMemo } from "react";

import { useQuery } from "convex/react";
import { api } from "@/lib/convexClient";
import { getMonthInfo } from "../months";
import {
  expenseDocumentRowsForMonth,
  summarizeExpenseDocuments,
} from "./transform";
import type { InvoicesResult, InvoiceSummary } from "./types";

export type UseInvoicesResult = InvoicesResult;

export const useInvoices = (month: string): UseInvoicesResult => {
  const data = useQuery(api.expenseDocuments.listMine, {});
  const monthInfo = useMemo(() => getMonthInfo(month), [month]);

  const invoices = useMemo(() => {
    if (!data) return [];

    return expenseDocumentRowsForMonth(data, monthInfo);
  }, [data, monthInfo]);

  const summary = useMemo<InvoiceSummary>(() => {
    return summarizeExpenseDocuments(invoices);
  }, [invoices]);

  const totalCount = data?.length ?? 0;

  return {
    invoices,
    summary,
    isLoading: data === undefined,
    totalCount,
  };
};
