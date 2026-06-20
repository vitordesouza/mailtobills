import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function renderTable(documents: ExpenseDocumentRow[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExpenseDocumentsTable
        documents={documents}
        emptyLabel="No documents this month."
      />
    </NextIntlClientProvider>,
  );
}

describe("ExpenseDocumentsTable", () => {
  beforeEach(() => {
    mocks.refresh.mockClear();
    mocks.setPrimaryAttachment.mockClear();
    mocks.softDelete.mockClear();
    mocks.mutationCallCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders rows, expands attachments, and marks a secondary attachment primary", async () => {
    const user = userEvent.setup();
    renderTable([documentRow()]);

    expect(screen.getByText("invoice-primary.pdf")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);

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

    renderTable([documentRow(), secondDocumentRow()]);

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

  it("opens the drawer from the document row", async () => {
    const user = userEvent.setup();
    renderTable([documentRow()]);
    const row = screen.getByText("invoice-primary.pdf").closest("tr");

    expect(row).not.toBeNull();
    await user.click(row as HTMLElement);

    expect(
      screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
    ).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-selected", "true");
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])(
    "opens the drawer from the keyboard-focused document row with %s",
    async (_keyName, keyboardInput) => {
      const user = userEvent.setup();
      renderTable([documentRow()]);
      const row = screen.getByText("invoice-primary.pdf").closest("tr");
      expect(row).not.toBeNull();

      (row as HTMLElement).focus();
      await user.keyboard(keyboardInput);

      expect(
        screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
      ).toBeInTheDocument();
    },
  );

  it("restores focus to the row when the row opened the drawer", async () => {
    const user = userEvent.setup();
    renderTable([documentRow()]);
    const row = screen.getByText("invoice-primary.pdf").closest("tr");
    expect(row).not.toBeNull();

    await user.click(row as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(row).toHaveFocus());
  });

  it("opens a selected expanded attachment in the drawer", async () => {
    const user = userEvent.setup();
    renderTable([documentRow()]);

    await user.click(
      screen.getByRole("button", { name: /expand attachments/i }),
    );
    const secondary = screen
      .getByText("invoice-secondary.pdf")
      .closest("div[class*='rounded-md']");
    expect(secondary).not.toBeNull();

    await user.click(
      within(secondary as HTMLElement).getByRole("button", {
        name: /open/i,
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "invoice-secondary.pdf" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("Preview invoice-secondary.pdf")).toHaveAttribute(
      "src",
      "/api/files/attachment-secondary",
    );
  });

  it("keeps destructive deletion behind the drawer overflow menu", () => {
    renderTable([documentRow()]);

    expect(
      screen.queryByRole("button", { name: "Delete document" }),
    ).not.toBeInTheDocument();
  });

  it("restores focus to the view action when the drawer closes", async () => {
    const user = userEvent.setup();
    renderTable([documentRow()]);
    const viewAction = screen.getByRole("button", { name: /view pdf/i });

    await user.click(viewAction);
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(viewAction).toHaveFocus());
  });

  it("advances to the next document after deletion succeeds", async () => {
    const user = userEvent.setup();
    renderTable([documentRow(), secondDocumentRow()]);

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
    renderTable([documentRow()]);

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
    renderTable([documentRow(), secondDocumentRow()]);

    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);
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

    await user.click(screen.getByRole("button", { name: "Next document" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "second-invoice.pdf" }),
    ).toBeInTheDocument();
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
    renderTable([documentRow(), secondDocumentRow()]);

    await user.click(screen.getAllByRole("button", { name: /view pdf/i })[0]!);
    await confirmDrawerDelete(user);

    expect(
      screen.getByRole("button", { name: "Next document" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
    ).toBeInTheDocument();
    resolveDelete?.();
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it("reports a failed expanded attachment action above the table", async () => {
    const user = userEvent.setup();
    const error = new Error("primary failed");
    mocks.setPrimaryAttachment.mockRejectedValueOnce(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    renderTable([documentRow()]);

    await user.click(
      screen.getByRole("button", { name: /expand attachments/i }),
    );
    await user.click(screen.getByRole("button", { name: /make primary/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The action could not be completed. Please try again.",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "expense_document_action_failed",
      { id: "attachment-secondary", error },
    );
  });

  it("disables the PDF action when no primary file is available", () => {
    const document = documentRow();
    document.primaryAttachment = undefined;
    document.primaryAttachmentId = undefined;
    document.attachments = [];

    renderTable([document]);

    expect(screen.getByRole("button", { name: /view pdf/i })).toBeDisabled();
  });
});
