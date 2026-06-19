import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ExpenseDocumentAttachment,
  ExpenseDocumentRow,
} from "@mailtobills/domain";

import { ExpenseDocumentDetailPanel } from "./expense-document-detail-panel";

const matchMedia = vi.fn((query: string) => ({
  matches: query === "(min-width: 640px)",
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

function documentRow(): ExpenseDocumentRow {
  const timestamp = Date.UTC(2026, 5, 12);
  const attachments: ExpenseDocumentAttachment[] = [
    {
      id: "attachment-primary",
      expenseDocumentId: "doc-1",
      originalFilename: "invoice-primary.pdf",
      mimeType: "application/pdf",
      fileSize: 250_000,
      originalOrder: 0,
      createdAt: timestamp,
      downloadUrl: "/api/files/attachment-primary",
    },
    {
      id: "attachment-secondary",
      expenseDocumentId: "doc-1",
      originalFilename: "invoice-secondary.pdf",
      mimeType: "application/pdf",
      fileSize: 100_000,
      originalOrder: 1,
      createdAt: timestamp,
      downloadUrl: "/api/files/attachment-secondary",
    },
  ];

  return {
    id: "doc-1",
    userId: "user-1",
    fromEmail: "forwarder@example.com",
    subject: "Forwarded invoice",
    receivedAt: timestamp,
    createdAt: timestamp,
    dedupeKey: "doc-1",
    originFromEmail: "billing@supplier.test",
    originSubject: "June invoice",
    originSentAt: timestamp - 86_400_000,
    attachments,
    primaryAttachmentId: attachments[0]!.id,
    primaryAttachment: attachments[0]!,
  };
}

function renderPanel(
  overrides: Partial<
    React.ComponentProps<typeof ExpenseDocumentDetailPanel>
  > = {},
) {
  const document = documentRow();
  const props: React.ComponentProps<typeof ExpenseDocumentDetailPanel> = {
    open: true,
    document,
    selectedAttachment: document.primaryAttachment ?? null,
    documentIndex: 0,
    documentCount: 2,
    onOpenChange: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onSelectAttachment: vi.fn(),
    onMakePrimary: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };

  return { ...render(<ExpenseDocumentDetailPanel {...props} />), props };
}

describe("ExpenseDocumentDetailPanel", () => {
  beforeEach(() => {
    window.matchMedia = matchMedia;
  });

  it("exposes pager, attachment, and download controls", async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    expect(
      screen.getByRole("dialog", { name: "invoice-primary.pdf" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download pdf/i })).toHaveAttribute(
      "href",
      "/api/files/attachment-primary",
    );

    await user.click(screen.getByRole("button", { name: "Next document" }));
    await user.click(
      screen.getByRole("button", { name: "Preview invoice-secondary.pdf" }),
    );

    expect(props.onNext).toHaveBeenCalledOnce();
    expect(props.onSelectAttachment).toHaveBeenCalledWith(
      "attachment-secondary",
    );
  });

  it("confirms deletion from the overflow menu", async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    await user.click(
      screen.getByRole("button", { name: "More document actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Delete document" }));

    expect(
      screen.getByRole("alertdialog", {
        name: "Delete this expense document?",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete document" }));
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it("restores focus to the overflow button when deletion is canceled", async () => {
    const user = userEvent.setup();
    renderPanel();
    const moreActions = screen.getByRole("button", {
      name: "More document actions",
    });

    await user.click(moreActions);
    await user.click(screen.getByRole("menuitem", { name: "Delete document" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(moreActions).toHaveFocus();
  });

  it("shows the fallback when the file route does not return a PDF", () => {
    renderPanel();

    const iframe = screen.getByTitle("Preview invoice-primary.pdf");
    fireEvent.load(iframe);

    expect(screen.getByText("Can't preview this PDF here")).toBeInTheDocument();
  });

  it("shows the fallback when an attachment has no file URL", () => {
    const document = documentRow();
    const unavailable = {
      ...document.attachments[1]!,
      downloadUrl: undefined,
      fileUrl: undefined,
    };

    renderPanel({ document, selectedAttachment: unavailable });

    expect(screen.getByText("Can't preview this PDF here")).toBeInTheDocument();
  });
});
