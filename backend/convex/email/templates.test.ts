import { describe, expect, it } from "vitest";

import {
  buildAccountantExportEmail,
  buildEmptyMonthEmail,
  buildExportFailureEmail,
  buildLapseNotificationEmail,
} from "./templates";

describe("email templates", () => {
  it("builds English Accountant Export emails by default", () => {
    const email = buildAccountantExportEmail({
      customerName: "Owner",
      accountantName: "Marta",
      month: 1,
      year: 2026,
    });

    expect(email.subject).toBe("MailToBills - Documents for January 2026");
    expect(email.bodyHtml).toContain("Hi Marta");
    expect(email.bodyHtml).toContain("collected in January 2026 by Owner");
  });

  it("builds Portuguese Accountant Export emails for pt-PT customers", () => {
    const email = buildAccountantExportEmail({
      customerName: "Joana",
      accountantName: "Marta",
      month: 1,
      year: 2026,
      locale: "pt-PT",
    });

    expect(email.subject).toBe("MailToBills - Documentos de janeiro 2026");
    expect(email.bodyHtml).toContain("Olá Marta");
    expect(email.bodyHtml).toContain("recolhidos em janeiro 2026 por Joana");
  });

  it("escapes dynamic email fields", () => {
    const email = buildAccountantExportEmail({
      customerName: "Owner & Co",
      accountantName: "<Marta>",
      month: 1,
      year: 2026,
    });

    expect(email.bodyHtml).toContain("Hi &lt;Marta&gt;");
    expect(email.bodyHtml).toContain("by Owner &amp; Co");
  });

  it("localizes empty month, failure, and lapse emails", () => {
    expect(
      buildEmptyMonthEmail({
        customerName: "Owner",
        month: 2,
        year: 2026,
      }).subject,
    ).toBe("MailToBills - No documents in February 2026");

    expect(
      buildExportFailureEmail({
        customerName: "Joana",
        month: 2,
        year: 2026,
        dashboardUrl: "https://app.example.test/m/2026-02",
        locale: "pt-PT",
      }).subject,
    ).toBe("MailToBills - Falha no envio de fevereiro 2026");

    expect(
      buildLapseNotificationEmail({
        customerName: "Owner",
        settingsUrl: "https://app.example.test/settings",
      }).subject,
    ).toBe("MailToBills - Your Pro plan ended");
  });
});
