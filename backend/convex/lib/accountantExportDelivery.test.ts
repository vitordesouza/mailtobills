import { describe, expect, it, vi } from "vitest";

import {
  sendManualAccountantExport,
  sendScheduledAccountantExport,
} from "./accountantExportDelivery";

import type { Id } from "../_generated/dataModel";
import type { EmailSender } from "../email";

const userId = "user-1" as Id<"users">;

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function exportZip(documentCount: number) {
  return {
    filename: "mailtobills-2026-01.zip",
    zipBytes: bytes("zip"),
    documentCount,
  };
}

function deliveryDeps({
  documentCount = 1,
  send,
}: {
  documentCount?: number;
  send?: EmailSender["send"];
} = {}) {
  return {
    buildAccountantExportZip: vi.fn(() =>
      Promise.resolve(exportZip(documentCount)),
    ),
    emailSender: {
      send: send ?? vi.fn(() => Promise.resolve()),
    },
    markExportScheduleSent: vi.fn(() => Promise.resolve()),
    siteUrl: "https://app.example.test",
    logError: vi.fn(),
  };
}

describe("Accountant Export delivery", () => {
  it("sends a manual Accountant Export directly for Pro Customers", async () => {
    const deps = deliveryDeps();

    await expect(
      sendManualAccountantExport({
        deps,
        customer: {
          name: "Owner",
          email: "owner@example.com",
          isPro: true,
          accountantEmail: "accountant@example.com",
          accountantName: "Marta",
        },
        userId,
        month: "2026-01",
      }),
    ).resolves.toEqual({ sentTo: "accountant@example.com" });

    expect(deps.buildAccountantExportZip).toHaveBeenCalledWith({
      userId,
      month: "2026-01",
    });
    expect(deps.emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "accountant@example.com",
        cc: "owner@example.com",
        fromName: "Owner",
        attachment: expect.objectContaining({
          filename: "mailtobills-2026-01.zip",
        }),
      }),
    );
  });

  it("keeps manual direct send behind the Pro Plan", async () => {
    const deps = deliveryDeps();

    await expect(
      sendManualAccountantExport({
        deps,
        customer: {
          email: "owner@example.com",
          isPro: false,
          accountantEmail: "accountant@example.com",
        },
        userId,
        month: "2026-01",
      }),
    ).rejects.toThrow("PRO_REQUIRED");

    expect(deps.buildAccountantExportZip).not.toHaveBeenCalled();
    expect(deps.emailSender.send).not.toHaveBeenCalled();
  });

  it("notifies the Customer and marks the Export Schedule sent for empty months", async () => {
    const deps = deliveryDeps({ documentCount: 0 });

    await expect(
      sendScheduledAccountantExport({
        deps,
        customer: {
          _id: userId,
          name: "Owner",
          email: "owner@example.com",
          accountantEmail: "accountant@example.com",
        },
        month: "2026-01",
      }),
    ).resolves.toEqual({ status: "empty_month" });

    const emptyMonthEmail = vi.mocked(deps.emailSender.send).mock.calls[0]?.[0];
    expect(emptyMonthEmail).toEqual(
      expect.objectContaining({
        to: "owner@example.com",
        fromName: "Owner",
      }),
    );
    expect(emptyMonthEmail?.attachment).toBeUndefined();
    expect(deps.markExportScheduleSent).toHaveBeenCalledWith({
      userId,
      month: "2026-01",
    });
  });

  it("retries scheduled delivery, notifies the Customer after final failure, and leaves the month unsent", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("second"))
      .mockRejectedValueOnce(new Error("third"))
      .mockResolvedValueOnce(undefined);
    const deps = deliveryDeps({ send });

    await expect(
      sendScheduledAccountantExport({
        deps,
        customer: {
          _id: userId,
          name: "Owner",
          email: "owner@example.com",
          accountantEmail: "accountant@example.com",
        },
        month: "2026-01",
      }),
    ).resolves.toEqual({ status: "failed" });

    expect(send).toHaveBeenCalledTimes(4);
    const failureEmail = send.mock.calls.at(-1)?.[0];
    expect(failureEmail).toEqual(
      expect.objectContaining({
        to: "owner@example.com",
      }),
    );
    expect(failureEmail?.attachment).toBeUndefined();
    expect(deps.markExportScheduleSent).not.toHaveBeenCalled();
    expect(deps.logError).toHaveBeenCalledWith(
      "Scheduled export send failed after retries",
      expect.objectContaining({
        userId,
        month: "2026-01",
      }),
    );
  });
});
