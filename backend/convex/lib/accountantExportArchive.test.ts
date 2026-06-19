import { describe, expect, it } from "vitest";

import {
  buildManifestCsv,
  buildZip,
  sanitizeZipName,
} from "./accountantExportArchive";

describe("accountant export archive", () => {
  it("builds a quoted Manifest CSV", () => {
    const csv = buildManifestCsv([
      {
        id: "doc-1",
        filename: 'invoice "one".pdf',
        sender: "billing@example.com",
        subject: "Invoice, January",
        receivedAt: Date.UTC(2026, 0, 5, 10, 30),
        attachmentCount: 2,
      },
    ]);

    expect(csv).toBe(
      '"document id","primary filename","sender","email subject","received timestamp","attachment count"\n' +
        '"doc-1","invoice ""one"".pdf","billing@example.com","Invoice, January","2026-01-05T10:30:00.000Z","2"\n',
    );
  });

  it("sanitizes ZIP path segments", () => {
    expect(sanitizeZipName(" ../invoice 01.pdf ")).toBe("invoice_01.pdf");
    expect(sanitizeZipName("///")).toBe("file");
  });

  it("builds a ZIP archive with local and central directory records", () => {
    const zip = buildZip([
      {
        name: "manifest.csv",
        bytes: new TextEncoder().encode("id\n1\n"),
      },
    ]);

    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.byteLength - 22, true)).toBe(0x06054b50);
    expect(new TextDecoder().decode(zip)).toContain("manifest.csv");
  });
});
