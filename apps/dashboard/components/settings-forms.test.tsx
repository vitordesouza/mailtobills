import { fireEvent, render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportScheduleForm } from "./export-schedule-form";
import { ForwardingAddressesForm } from "./forwarding-addresses-form";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  addForwardingAddress: vi.fn(() => Promise.resolve()),
  removeForwardingAddress: vi.fn(() => Promise.resolve()),
  updateExportSchedule: vi.fn(() => Promise.resolve()),
  mutationCallCount: 0,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => {
    mocks.mutationCallCount += 1;
    if (mocks.mutationCallCount === 1) return mocks.addForwardingAddress;
    if (mocks.mutationCallCount === 2) return mocks.removeForwardingAddress;
    return mocks.updateExportSchedule;
  }),
}));

describe("settings forms", () => {
  beforeEach(() => {
    mocks.refresh.mockClear();
    mocks.addForwardingAddress.mockClear();
    mocks.removeForwardingAddress.mockClear();
    mocks.updateExportSchedule.mockClear();
    mocks.mutationCallCount = 0;
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
      expect(mocks.removeForwardingAddress).toHaveBeenCalledWith({
        email: "existing@example.com",
      }),
    );
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
    await user.click(screen.getByRole("button", { name: /save export schedule/i }));

    await waitFor(() =>
      expect(mocks.updateExportSchedule).toHaveBeenCalledWith({
        accountantEmail: "books@example.com",
        accountantName: "Books Team",
        exportScheduleDay: 12,
      }),
    );

    await user.click(screen.getByRole("button", { name: /^disable$/i }));

    await waitFor(() =>
      expect(mocks.updateExportSchedule).toHaveBeenLastCalledWith({
        accountantEmail: "books@example.com",
        accountantName: "Books Team",
        exportScheduleDay: undefined,
      }),
    );
  });

  it("validates accountant email before enabling a schedule", async () => {
    render(
      <ExportScheduleForm
        isPro
        accountantEmail=""
        accountantName=""
        exportScheduleDay={5}
      />,
    );

    const emailInput = screen.getByLabelText(/accountant address/i);
    fireEvent.change(emailInput, {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: /save export schedule/i })
        .closest("form") as HTMLFormElement,
    );

    expect(
      screen.getByText(/valid accountant address is required/i),
    ).toBeInTheDocument();
    expect(mocks.updateExportSchedule).not.toHaveBeenCalled();
  });
});
