import { describe, expect, it, vi } from "vitest";

import { buildAccountantExportZip } from "./accountantExport";

import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";

function textBytes(value: string) {
  return new TextEncoder().encode(value);
}

describe("buildAccountantExportZip", () => {
  it("builds a ZIP with stored and remote primary attachments plus a manifest", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(textBytes("remote-pdf"))),
    );
    vi.stubGlobal("fetch", fetchMock);

    const ctx = {
      runQuery: vi.fn(() =>
        Promise.resolve([
          {
            _id: "doc-storage",
            fromEmail: "forwarder@example.com",
            subject: "Stored invoice",
            receivedAt: Date.UTC(2026, 0, 5),
            originFromEmail: "billing@example.com",
            attachments: [{}, {}],
            primaryAttachment: {
              originalFilename: "../stored invoice.pdf",
              fileStorageId: "storage-1" as Id<"_storage">,
            },
          },
          {
            _id: "doc-remote",
            fromEmail: "remote@example.com",
            subject: "Remote invoice",
            receivedAt: Date.UTC(2026, 0, 6),
            attachments: [{}],
            primaryAttachment: {
              originalFilename: "remote.pdf",
              fileUrl: "https://files.example.com/remote.pdf",
            },
          },
          {
            _id: "doc-missing",
            fromEmail: "missing@example.com",
            subject: "Missing invoice",
            receivedAt: Date.UTC(2026, 0, 7),
            attachments: [{}],
            primaryAttachment: {
              originalFilename: "missing.pdf",
            },
          },
          {
            _id: "doc-no-primary",
            fromEmail: "no-primary@example.com",
            subject: "No primary",
            receivedAt: Date.UTC(2026, 0, 8),
            attachments: [{}],
            primaryAttachment: null,
          },
        ]),
      ),
      storage: {
        get: vi.fn(() => Promise.resolve(new Blob([textBytes("stored-pdf")]))),
      } as unknown as ActionCtx["storage"],
    } satisfies Pick<ActionCtx, "runQuery" | "storage">;

    const result = await buildAccountantExportZip(ctx, {
      userId: "user-1" as Id<"users">,
      month: "2026-01",
    });
    const zipText = new TextDecoder().decode(result.zipBytes);

    expect(result.filename).toBe("mailtobills-2026-01.zip");
    expect(result.documentCount).toBe(2);
    expect(result.includedDocumentCount).toBe(2);
    expect(result.pdfFileCount).toBe(2);
    expect(result.manifestFileCount).toBe(1);
    expect(result.fileCount).toBe(3);
    expect(result.skippedDocuments).toEqual([
      {
        id: "doc-no-primary",
        reason: "missing_primary_attachment",
      },
      {
        id: "doc-missing",
        reason: "unreadable_primary_attachment",
      },
    ]);
    expect(ctx.storage.get).toHaveBeenCalledWith("storage-1");
    expect(fetchMock).toHaveBeenCalledWith("https://files.example.com/remote.pdf");
    expect(zipText).toContain("pdfs/doc-storage-stored_invoice.pdf");
    expect(zipText).toContain("pdfs/doc-remote-remote.pdf");
    expect(zipText).toContain("manifest.csv");
    expect(zipText).toContain("billing@example.com");
    expect(zipText).toContain("remote@example.com");
    expect(zipText).not.toContain("missing@example.com");
  });
});
