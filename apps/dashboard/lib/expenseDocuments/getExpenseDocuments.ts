import "server-only";

import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@mailtobills/convex/_generated/api";

import type { ExpenseDocumentsResult } from "./types";
import { addExpenseDocumentDownloadUrls } from "./transform";

export async function getExpenseDocuments(
  month: string,
): Promise<ExpenseDocumentsResult> {
  const token = await convexAuthNextjsToken();
  const data = await fetchQuery(
    api.expenseDocuments.getCollectionMonthDashboard,
    { month },
    { token },
  );
  const withDownloadUrls = addExpenseDocumentDownloadUrls(data);

  return {
    ...withDownloadUrls,
    isLoading: false,
  };
}
