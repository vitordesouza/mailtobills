import "server-only";

import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import { getMonthInfo } from "../months";
import type { ExpenseDocumentsResult } from "./types";
import {
  expenseDocumentRowsForMonth,
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

  return {
    documents,
    summary,
    isLoading: false,
    totalCount: data.length,
  };
}
