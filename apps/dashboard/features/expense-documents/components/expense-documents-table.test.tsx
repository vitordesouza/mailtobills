import { render, screen, waitFor, within } from "@testing-library/react";
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

function secondDocumentRow(): ExpenseDocumentRow {
  const document = documentRow();
  document.id = "doc-2";
  document.dedupeKey = "doc-2";
  document.subject = "Second invoice";
  document.primaryAttachmentId = "attachment-doc-2";
  document.primaryAttachment = {
    ...document.primaryAttachment!,
    id: "attachment-doc-2",
    expenseDocumentId: "doc-2",
    originalFilename: "second-invoice.pdf",
    downloadUrl: "/api/files/attachment-doc-2",
  };
  document.attachments = [document.primaryAttachment];
  return document;
}

async function confirmDrawerDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "More document actions" }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Delete document" }));
  await user.click(screen.getByRole("button", { name: "Delete document" }));
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

    render(
      <ExpenseDocumentsTable
        documents={[documentRow(), secondDocumentRow()]}
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

  it("restores focus to the view action when the drawer closes", async () => {
    const user = userEvent.setup();
    render(
      <ExpenseDocumentsTable
        documents={[documentRow()]}
        emptyLabel="No documents this month."
      />,
    );
    const viewAction = screen.getByRole("button", { name: /view pdf/i });

    await user.click(viewAction);
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(viewAction).toHaveFocus());
  });

  it("advances to the next document after deletion succeeds", async () => {
    const user = userEvent.setup();
    render(
      <ExpenseDocumentsTable
        documents={[documentRow(), secondDocumentRow()]}
        emptyLabel="No documents this month."
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);
    await confirmDrawerDelete(user);

    expect(mocks.softDelete).toHaveBeenCalledWith({
      expenseDocumentId: "doc-1",
    });
    expect(
      await screen.findByRole("dialog", { name: "second-invoice.pdf" }),
    ).toBeInTheDocument();
  });

  it("closes the drawer after deleting the final document", async () => {
    const user = userEvent.setup();
    render(
      <ExpenseDocumentsTable
        documents={[documentRow()]}
        emptyLabel="No documents this month."
      />,
    );

    await user.click(screen.getByRole("button", { name: /view pdf/i }));
    await confirmDrawerDelete(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the drawer open and reports a failed deletion", async () => {
    const user = userEvent.setup();
    const error = new Error("delete failed");
    mocks.softDelete.mockRejectedValueOnce(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(
      <ExpenseDocumentsTable
        documents={[documentRow()]}
        emptyLabel="No documents this month."
      />,
    );

    await user.click(screen.getByRole("button", { name: /view pdf/i }));
    await confirmDrawerDelete(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The document could not be deleted. Please try again.",
    );
    expect(
      screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      "expense_document_action_failed",
      { id: "doc-1", error },
    );
    consoleError.mockRestore();
  });

  it("disables navigation while deletion is pending", async () => {
    const user = userEvent.setup();
    let resolveDelete: (() => void) | undefined;
    mocks.softDelete.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    render(
      <ExpenseDocumentsTable
        documents={[documentRow(), secondDocumentRow()]}
        emptyLabel="No documents this month."
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);
    await confirmDrawerDelete(user);

    expect(
      screen.getByRole("button", { name: "Next document" }),
    ).toBeDisabled();
    resolveDelete?.();
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it("disables the PDF action when no primary file is available", () => {
    const document = documentRow();
    document.primaryAttachment = undefined;
    document.primaryAttachmentId = undefined;
    document.attachments = [];

    render(
      <ExpenseDocumentsTable
        documents={[document]}
        emptyLabel="No documents this month."
      />,
    );

    expect(screen.getByRole("button", { name: /view pdf/i })).toBeDisabled();
  });
});
