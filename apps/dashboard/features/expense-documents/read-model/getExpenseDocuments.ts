import "server-only";

import { fetchQuery } from "convex/nextjs";
import { api } from "@mailtobills/convex/_generated/api";

import { getCustomerAuthToken } from "@/features/customer/read-model/getCurrentCustomer";
import type { ExpenseDocumentsResult } from "./types";
import { addExpenseDocumentDownloadUrls } from "./transform";

export async function getExpenseDocuments(
  month: string,
): Promise<ExpenseDocumentsResult> {
  const token = await getCustomerAuthToken();
  const data = await fetchQuery(
    api.expenseDocuments.getCollectionMonthDashboard,
    { month },
    { token: token ?? undefined },
  );
  const withDownloadUrls = addExpenseDocumentDownloadUrls(data);

  return {
    ...withDownloadUrls,
    isLoading: false,
  };
}
