import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/en/common.json";
import { SendToAccountantButton } from "./send-to-accountant-button";

const mocks = vi.hoisted(() => ({
  sendManualExportToAccountant: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useAction: vi.fn(() => mocks.sendManualExportToAccountant),
}));

function renderButton(
  props: Partial<React.ComponentProps<typeof SendToAccountantButton>> = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SendToAccountantButton
        month="2026-01"
        isPro
        accountantEmail="accountant@example.com"
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe("SendToAccountantButton", () => {
  beforeEach(() => {
    mocks.sendManualExportToAccountant.mockReset();
  });

  it("points Free customers to settings while keeping ZIP download available", () => {
    renderButton({ isPro: false });

    expect(screen.getByText(/Direct send is available on Pro/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Upgrade in settings" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("points Pro customers without an Accountant Address to settings", () => {
    renderButton({ accountantEmail: undefined });

    expect(screen.getByText(/No accountant configured/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Configure accountant first" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("sends the export and announces success", async () => {
    const user = userEvent.setup();
    mocks.sendManualExportToAccountant.mockResolvedValueOnce({
      sentTo: "accountant@example.com",
    });
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send to accountant" }));

    expect(mocks.sendManualExportToAccountant).toHaveBeenCalledWith({
      month: "2026-01",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sent to accountant@example.com",
    );
  });

  it("announces localized send failures", async () => {
    const user = userEvent.setup();
    mocks.sendManualExportToAccountant.mockRejectedValueOnce(
      new Error("RESEND_SEND_FAILED"),
    );
    renderButton();

    await user.click(screen.getByRole("button", { name: "Send to accountant" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The email provider could not send this export.",
    );
  });
});
