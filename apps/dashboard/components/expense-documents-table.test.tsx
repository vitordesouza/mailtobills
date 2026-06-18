import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExpenseDocumentRow } from "@mailtobills/types";

import { ExpenseDocumentsTable } from "./expense-documents-table";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  setPrimaryAttachment: vi.fn(() => Promise.resolve()),
  softDelete: vi.fn(() => Promise.resolve()),
  mutationCallCount: 0,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => {
    mocks.mutationCallCount += 1;
    return mocks.mutationCallCount % 2 === 1
      ? mocks.setPrimaryAttachment
      : mocks.softDelete;
  }),
}));

function documentRow(): ExpenseDocumentRow {
  const receivedAt = Date.UTC(2026, 0, 12);
  return {
    id: "doc-1",
    userId: "user-1",
    fromEmail: "forwarder@example.com",
    subject: "January invoice",
    receivedAt,
    createdAt: receivedAt,
    dedupeKey: "doc-1",
    originFromEmail: "billing@supplier.test",
    attachments: [
      {
        id: "attachment-primary",
        expenseDocumentId: "doc-1",
        originalFilename: "invoice-primary.pdf",
        mimeType: "application/pdf",
        fileSize: 250_000,
        originalOrder: 0,
        createdAt: receivedAt,
        downloadUrl: "/api/files/attachment-primary",
      },
      {
        id: "attachment-secondary",
        expenseDocumentId: "doc-1",
        originalFilename: "invoice-secondary.pdf",
        mimeType: "application/pdf",
        fileSize: 100_000,
        originalOrder: 1,
        createdAt: receivedAt,
        downloadUrl: "/api/files/attachment-secondary",
      },
    ],
    primaryAttachmentId: "attachment-primary",
    primaryAttachment: {
      id: "attachment-primary",
      expenseDocumentId: "doc-1",
      originalFilename: "invoice-primary.pdf",
      mimeType: "application/pdf",
      fileSize: 250_000,
      originalOrder: 0,
      createdAt: receivedAt,
      downloadUrl: "/api/files/attachment-primary",
    },
  };
}

describe("ExpenseDocumentsTable", () => {
  beforeEach(() => {
    mocks.refresh.mockClear();
    mocks.setPrimaryAttachment.mockClear();
    mocks.softDelete.mockClear();
    mocks.mutationCallCount = 0;
  });

  it("renders rows, expands attachments, and marks a secondary attachment primary", async () => {
    const user = userEvent.setup();
    render(
      <ExpenseDocumentsTable
        documents={[documentRow()]}
        emptyLabel="No documents this month."
      />,
    );

    expect(screen.getByText("invoice-primary.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view pdf/i })).toHaveAttribute(
      "href",
      "/api/files/attachment-primary",
    );

    await user.click(screen.getByRole("button", { name: /expand attachments/i }));

    const secondary = screen
      .getByText("invoice-secondary.pdf")
      .closest("div[class*='rounded-md']");
    expect(secondary).not.toBeNull();

    await user.click(
      within(secondary as HTMLElement).getByRole("button", {
        name: /make primary/i,
      }),
    );

    expect(mocks.setPrimaryAttachment).toHaveBeenCalledWith({
      expenseDocumentId: "doc-1",
      attachmentId: "attachment-secondary",
    });
  });
});
