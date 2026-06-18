import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildManifestCsv,
  buildZip,
  sanitizeZipName,
} from "./exportUtils.js";

describe("accountant export utilities", () => {
  it("builds a quoted manifest CSV", () => {
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

    assert.equal(
      csv,
      '"document id","primary filename","sender","email subject","received timestamp","attachment count"\n' +
        '"doc-1","invoice ""one"".pdf","billing@example.com","Invoice, January","2026-01-05T10:30:00.000Z","2"\n',
    );
  });

  it("sanitizes ZIP path segments", () => {
    assert.equal(sanitizeZipName(" ../invoice 01.pdf "), "invoice_01.pdf");
    assert.equal(sanitizeZipName("///"), "file");
  });

  it("builds a ZIP archive with local and central directory records", () => {
    const zip = buildZip([
      {
        name: "manifest.csv",
        bytes: new TextEncoder().encode("id\n1\n"),
      },
    ]);

    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    assert.equal(view.getUint32(0, true), 0x04034b50);
    assert.equal(view.getUint32(zip.byteLength - 22, true), 0x06054b50);
    assert.equal(new TextDecoder().decode(zip).includes("manifest.csv"), true);
  });
});
