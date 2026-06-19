import type {
  CollectionMonthExpenseDocuments,
} from "@mailtobills/types";

export type ExpenseDocumentsResult = CollectionMonthExpenseDocuments & {
  isLoading: boolean;
};
