import "server-only";

import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { getMonthInfo } from "../months";
import type { ExpenseDocumentsResult } from "./types";
import {
  expenseDocumentRowsForMonth,
  summarizeAccountantExportForMonth,
  summarizeExpenseDocuments,
} from "./transform";

export async function getExpenseDocuments(
  month: string,
): Promise<ExpenseDocumentsResult> {
  const token = await convexAuthNextjsToken();
  const data = await fetchQuery(api.expenseDocuments.listMine, {}, { token });
  const monthInfo = getMonthInfo(month);

  const documents = expenseDocumentRowsForMonth(data, monthInfo);
  const summary = summarizeExpenseDocuments(documents);
  const exportSummary = summarizeAccountantExportForMonth(data, monthInfo);
  const previousMonthInfo = getMonthInfo(monthInfo.previous);
  const previousSummary = summarizeExpenseDocuments(
    expenseDocumentRowsForMonth(data, previousMonthInfo),
  );
  const previousExportSummary = summarizeAccountantExportForMonth(
    data,
    previousMonthInfo,
  );

  return {
    documents,
    summary,
    previousSummary,
    exportSummary,
    previousExportSummary,
    isLoading: false,
    totalCount: data.length,
  };
}
