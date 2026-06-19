import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExpenseDocumentRow } from "@mailtobills/domain";

import messages from "@/messages/en/common.json";
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
      <NextIntlClientProvider locale="en" messages={messages}>
        <ExpenseDocumentsTable
          documents={[documentRow()]}
          emptyLabel="No documents this month."
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("invoice-primary.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /view pdf/i }));

    expect(
      screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Preview invoice-primary.pdf")).toHaveAttribute(
      "src",
      "/api/files/attachment-primary",
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(
      screen.getByRole("button", { name: /expand attachments/i }),
    );

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

  it("moves between documents without closing the drawer", async () => {
    const user = userEvent.setup();
    const secondDocument = documentRow();
    secondDocument.id = "doc-2";
    secondDocument.dedupeKey = "doc-2";
    secondDocument.subject = "Second invoice";
    secondDocument.primaryAttachmentId = "attachment-doc-2";
    secondDocument.primaryAttachment = {
      ...secondDocument.primaryAttachment!,
      id: "attachment-doc-2",
      expenseDocumentId: "doc-2",
      originalFilename: "second-invoice.pdf",
      downloadUrl: "/api/files/attachment-doc-2",
    };
    secondDocument.attachments = [secondDocument.primaryAttachment!];

    render(
      <ExpenseDocumentsTable
        documents={[documentRow(), secondDocument]}
        emptyLabel="No documents this month."
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);
    await user.click(screen.getByRole("button", { name: "Next document" }));

    expect(
      screen.getByRole("dialog", { name: "second-invoice.pdf" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Preview second-invoice.pdf")).toHaveAttribute(
      "src",
      "/api/files/attachment-doc-2",
    );
  });
});
