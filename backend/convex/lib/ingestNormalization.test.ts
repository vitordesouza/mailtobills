import { describe, expect, it } from "vitest";

import {
  buildBinaryIngestDedupeMaterial,
  buildJsonIngestDedupeMaterial,
  decodeBase64Payload,
  normalizeBinaryIngestPayload,
  normalizeJsonIngestPayload,
  shortDedupeKey,
} from "./ingestNormalization";

import type { Id } from "../_generated/dataModel";

const userId = "user-1" as Id<"users">;

function expectOk<T>(result: { ok: true; payload: T } | { ok: false }) {
  if (!result.ok) {
    throw new Error("Expected normalization to succeed");
  }

  return result.payload;
}

describe("ingest normalization", () => {
  it("normalizes the current n8n JSON payload shape", () => {
    const payload = expectOk(
      normalizeJsonIngestPayload({
        forwarderFrom: " owner@example.com ",
        messageId: "message-1",
        subject: "Forwarded invoice",
        receivedAt: "2026-01-05T12:30:00.000Z",
        raw: {
          bodyPreview: "Forwarded message",
          body: {
            content:
              "<div>De: Supplier Ltd &lt;billing@supplier.pt&gt;</div>" +
              "<div>Data: 26 de maio de 2026 às 18:50</div>" +
              "<div>Assunto: Fatura Maio</div>",
          },
        },
        attachments: [
          {
            fileName: "fatura-2026-01.pdf",
            mimeType: "application/pdf",
            fileSize: "1200",
            key: "attachment-1",
            data: "SGVsbG8=",
            originalOrder: "2",
          },
          {
            filename: "logo.png",
            mimeType: "image/png",
            fileSize: 50,
          },
        ],
      }),
    );

    expect(payload.forwarderFrom).toBe("owner@example.com");
    expect(payload.messageId).toBe("message-1");
    expect(payload.receivedAt).toBe(Date.UTC(2026, 0, 5, 12, 30));
    expect(payload.originFromEmail).toBe("billing@supplier.pt");
    expect(payload.originFromName).toBe("Supplier Ltd");
    expect(payload.originDomain).toBe("supplier.pt");
    expect(payload.originSubject).toBe("Fatura Maio");
    expect(payload.originSentAt).toEqual(expect.any(Number));
    expect(payload.rawEmailMetadata).toEqual(
      expect.objectContaining({ bodyPreview: "Forwarded message" }),
    );
    expect(payload.attachments).toEqual([
      expect.objectContaining({
        originalFilename: "fatura-2026-01.pdf",
        mimeType: "application/pdf",
        fileSize: 1200,
        attachmentId: "attachment-1",
        originalOrder: 2,
        base64Data: "SGVsbG8=",
      }),
      expect.objectContaining({
        originalFilename: "logo.png",
        mimeType: "image/png",
        fileSize: 50,
        originalOrder: 1,
      }),
    ]);
  });

  it("keeps JSON payload validation errors explicit", () => {
    expect(normalizeJsonIngestPayload(null)).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: "INVALID_PAYLOAD" }),
      }),
    );
    expect(
      normalizeJsonIngestPayload({
        messageId: "message-1",
        receivedAt: Date.UTC(2026, 0, 5),
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: "MISSING_FORWARDER_FROM" }),
      }),
    );
    expect(
      normalizeJsonIngestPayload({
        forwarderFrom: "owner@example.com",
        messageId: "message-1",
        receivedAt: "not-a-date",
      }),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: "INVALID_RECEIVED_AT" }),
      }),
    );
  });

  it("normalizes legacy pdfMeta JSON payloads", () => {
    const payload = expectOk(
      normalizeJsonIngestPayload({
        forwarderFrom: "owner@example.com",
        messageId: "message-1",
        receivedAt: Date.UTC(2026, 0, 5),
        attachmentId: "body-attachment",
        pdfMeta: {
          fileName: "invoice.pdf",
          mimeType: "application/pdf",
          fileSize: "44",
          base64Data: "SGVsbG8=",
        },
      }),
    );

    expect(payload.attachments).toEqual([
      expect.objectContaining({
        originalFilename: "invoice.pdf",
        attachmentId: "body-attachment",
        fileSize: 44,
        base64Data: "SGVsbG8=",
        originalOrder: 0,
      }),
    ]);
  });

  it("normalizes binary ingest query parameters", () => {
    const payload = expectOk(
      normalizeBinaryIngestPayload(
        new URL(
          "https://convex.example.test/ingest?forwarderFrom=owner%40example.com" +
            "&messageId=message-1&subject=Invoice&receivedAt=1767225600000" +
            "&originalFilename=invoice.pdf&mimeType=application%2Fpdf" +
            "&fileSize=123&attachmentId=attachment-1",
        ),
      ),
    );

    expect(payload).toEqual(
      expect.objectContaining({
        fromEmail: "owner@example.com",
        messageId: "message-1",
        subject: "Invoice",
        receivedAt: 1767225600000,
        originalFilename: "invoice.pdf",
        mimeType: "application/pdf",
        fileSize: 123,
        attachmentId: "attachment-1",
      }),
    );

    expect(
      normalizeBinaryIngestPayload(new URL("https://convex.example.test/ingest")),
    ).toEqual(
      expect.objectContaining({
        ok: false,
        error: expect.objectContaining({ code: "MISSING_FORWARDING_EMAIL" }),
      }),
    );
  });

  it("builds stable dedupe material before hashing", async () => {
    const jsonMaterial = buildJsonIngestDedupeMaterial({
      userId,
      messageId: "message-1",
      receivedAt: 123,
      attachments: [
        {
          originalFilename: "b.pdf",
          originalOrder: 2,
          attachmentId: "attachment-b",
        },
        {
          originalFilename: "a.pdf",
          originalOrder: 1,
          fileSize: 55,
        },
      ],
    });

    expect(jsonMaterial).toBe(
      "user-1|message-1|123|2:attachment-b:b.pdf:|1::a.pdf:55",
    );
    expect(
      buildJsonIngestDedupeMaterial({
        userId,
        messageId: "message-1",
        receivedAt: 123,
        attachments: [],
        providedDedupeKey: "provided",
      }),
    ).toBe("provided");
    expect(
      buildBinaryIngestDedupeMaterial({
        userId,
        messageId: "message-1",
        receivedAt: 123,
        attachmentId: "attachment-1",
        originalFilename: "invoice.pdf",
        fileSize: 42,
      }),
    ).toBe("user-1|message-1|123|0:attachment-1:invoice.pdf:42");
    await expect(shortDedupeKey(jsonMaterial)).resolves.toMatch(/^d_/);
  });

  it("decodes data-url, base64, and base64url attachment payloads", () => {
    expect(
      new TextDecoder().decode(
        decodeBase64Payload("data:application/pdf;base64,SGVsbG8="),
      ),
    ).toBe("Hello");
    expect(new TextDecoder().decode(decodeBase64Payload("SGVsbG8"))).toBe(
      "Hello",
    );
    expect(decodeBase64Payload("--__")).toEqual(
      new Uint8Array([251, 239, 255]),
    );
  });

  it("rejects invalid base64 attachment payload lengths", () => {
    expect(() => decodeBase64Payload("abcde")).toThrow(
      "Invalid base64 payload length",
    );
  });
});
