import type {
  CollectionMonthExpenseDocuments,
} from "@mailtobills/domain";

export type ExpenseDocumentsResult = CollectionMonthExpenseDocuments & {
  isLoading: boolean;
};
