import type { AnchorHTMLAttributes, ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonthNavigator } from "./month-navigator";

const mocks = vi.hoisted(() => ({
  pathname: "/m/2026-03/reports",
  params: { month: "2026-03" as string | undefined },
  prefetch: vi.fn(),
  navigate: vi.fn(),
  isNavigating: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: mocks.prefetch }),
  usePathname: () => mocks.pathname,
  useParams: () => mocks.params,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  }) => {
    void prefetch;

    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/components/navigation-progress", () => ({
  useNavigationProgress: () => ({
    navigate: mocks.navigate,
    isNavigating: mocks.isNavigating,
  }),
}));

describe("MonthNavigator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
    mocks.pathname = "/m/2026-03/reports";
    mocks.params = { month: "2026-03" };
    mocks.isNavigating = false;
    mocks.prefetch.mockClear();
    mocks.navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a current-month action away from the current month", () => {
    render(<MonthNavigator />);

    expect(
      screen.getByRole("button", {
        name: "Go to current month, June 2026",
      }),
    ).toBeInTheDocument();
  });

  it("hides the current-month action on the current month", () => {
    mocks.pathname = "/m/2026-06";
    mocks.params = { month: "2026-06" };

    render(<MonthNavigator />);

    expect(
      screen.queryByRole("button", {
        name: "Go to current month, June 2026",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps the current route suffix when jumping to the current month", () => {
    render(<MonthNavigator />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Go to current month, June 2026",
      }),
    );

    expect(mocks.navigate).toHaveBeenCalledWith("/m/2026-06/reports");
  });

  it("opens a month grid and navigates to the selected month", () => {
    render(<MonthNavigator />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose month, currently March 2026",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "April 2026" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/m/2026-04/reports");
  });

  it("does not navigate when selecting the already-viewed month", () => {
    render(<MonthNavigator />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose month, currently March 2026",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "March 2026" }));

    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("announces the current month marker inside the picker", () => {
    render(<MonthNavigator />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose month, currently March 2026",
      }),
    );

    expect(
      screen.getByRole("button", { name: "June 2026, current month" }),
    ).toBeInTheDocument();
  });
});
