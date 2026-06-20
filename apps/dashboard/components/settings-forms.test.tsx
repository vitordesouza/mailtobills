import {
  render as renderComponent,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en/common.json";

import { ExportScheduleForm } from "./export-schedule-form";
import { ForwardingAddressesForm } from "./forwarding-addresses-form";
import { PreferencesSettings } from "./preferences-settings";

const mocks = vi.hoisted(() => ({
  updateForwardingAddress: vi.fn(),
  updateAccountantDeliverySettings: vi.fn(),
  setTheme: vi.fn(),
  refresh: vi.fn(),
  updateDashboardLocale: vi.fn(),
}));
vi.mock("@/features/customer/actions/updateDashboardLocale", () => ({
  updateDashboardLocale: mocks.updateDashboardLocale,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/features/customer/actions/updateCustomerSettings", () => ({
  updateForwardingAddress: mocks.updateForwardingAddress,
  updateAccountantDeliverySettings: mocks.updateAccountantDeliverySettings,
}));

function render(ui: React.ReactNode) {
  return renderComponent(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mocks.setTheme,
  }),
}));

describe("settings forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateForwardingAddress.mockResolvedValue({
      status: "success",
      intent: "remove",
      message: "Forwarding Address removed.",
    });
    mocks.updateAccountantDeliverySettings.mockClear();
    mocks.updateDashboardLocale.mockResolvedValue({
      status: "success",
      locale: "pt-PT",
    });
    mocks.updateAccountantDeliverySettings.mockImplementation(
      async (_state, data: FormData) => {
        const intent = data.get("intent");
        return {
          status: "success",
          intent,
          scheduleEnabled: intent === "save",
          message:
            intent === "save"
              ? "Export Schedule saved."
              : "Export Schedule disabled.",
        };
      },
    );
  });

  it("removes forwarding addresses for Pro users", async () => {
    const user = userEvent.setup();
    render(
      <ForwardingAddressesForm
        isPro
        primaryEmail="owner@example.com"
        forwardingEmails={["existing@example.com"]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /remove existing@example.com/i }),
    );

    await waitFor(() =>
      expect(mocks.updateForwardingAddress).toHaveBeenCalledOnce(),
    );
    const submitted = mocks.updateForwardingAddress.mock
      .calls[0]?.[1] as FormData;
    expect(Object.fromEntries(submitted.entries())).toEqual({
      email: "existing@example.com",
      intent: "remove",
    });
    expect(
      await screen.findByText("Forwarding Address removed."),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Additional forwarding address"),
      "n",
    );
    expect(
      screen.queryByText("Forwarding Address removed."),
    ).not.toBeInTheDocument();
  });

  it("keeps forwarding address controls disabled for Free users", () => {
    render(
      <ForwardingAddressesForm
        isPro={false}
        primaryEmail="owner@example.com"
        forwardingEmails={["existing@example.com"]}
      />,
    );

    expect(screen.getByPlaceholderText("name@example.com")).toBeDisabled();
    expect(screen.getByRole("button", { name: /^add$/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /remove existing@example.com/i }),
    ).toBeDisabled();
  });

  it("saves and disables export schedules", async () => {
    const user = userEvent.setup();
    render(
      <ExportScheduleForm
        isPro
        accountantEmail="accountant@example.com"
        accountantName="Marta"
        exportScheduleDay={5}
      />,
    );

    await user.clear(screen.getByLabelText(/accountant address/i));
    await user.type(
      screen.getByLabelText(/accountant address/i),
      "books@example.com",
    );
    await user.clear(screen.getByLabelText(/accountant name/i));
    await user.type(screen.getByLabelText(/accountant name/i), "Books Team");
    await user.selectOptions(screen.getByLabelText(/send on day/i), "12");
    await user.click(
      screen.getByRole("button", { name: /save export schedule/i }),
    );

    await waitFor(() =>
      expect(mocks.updateAccountantDeliverySettings).toHaveBeenCalledOnce(),
    );
    const saveData = mocks.updateAccountantDeliverySettings.mock
      .calls[0]?.[1] as FormData;
    expect(Object.fromEntries(saveData.entries())).toEqual({
      accountantEmail: "books@example.com",
      accountantName: "Books Team",
      exportScheduleDay: "12",
      intent: "save",
      scheduleEnabled: "on",
    });
    expect(
      await screen.findByText("Export Schedule saved."),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/accountant name/i), " Updated");
    expect(
      screen.queryByText("Export Schedule saved."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^disable$/i }));

    await waitFor(() =>
      expect(mocks.updateAccountantDeliverySettings).toHaveBeenCalledTimes(2),
    );
    const disableData = mocks.updateAccountantDeliverySettings.mock
      .calls[1]?.[1] as FormData;
    expect(disableData.get("intent")).toBe("disable");
  });

  it("shows server-owned validation for an invalid Accountant Address", async () => {
    mocks.updateAccountantDeliverySettings.mockResolvedValueOnce({
      status: "error",
      intent: "save",
      message: "A valid Accountant Address is required.",
    });
    const user = userEvent.setup();
    render(
      <ExportScheduleForm
        isPro
        accountantEmail=""
        accountantName=""
        exportScheduleDay={5}
      />,
    );

    await user.type(
      screen.getByLabelText(/accountant address/i),
      "not-an-email",
    );
    await user.click(
      screen.getByRole("button", { name: /save export schedule/i }),
    );

    expect(mocks.updateAccountantDeliverySettings).toHaveBeenCalledOnce();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A valid Accountant Address is required.",
    );
  });

  it("lets the Customer choose a dashboard theme", async () => {
    const user = userEvent.setup();
    render(<PreferencesSettings />);

    await user.click(screen.getByRole("button", { name: /dark/i }));

    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    await user.selectOptions(screen.getByLabelText(/language/i), "pt-PT");
    await waitFor(() =>
      expect(mocks.updateDashboardLocale).toHaveBeenCalledWith("pt-PT"),
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
