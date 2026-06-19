import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authToken: vi.fn(),
  fetchQuery: vi.fn(),
  getExpenseDocuments: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: mocks.authToken,
}));
vi.mock("convex/nextjs", () => ({
  fetchQuery: mocks.fetchQuery,
}));
vi.mock("@/features/expense-documents/read-model/getExpenseDocuments", () => ({
  getExpenseDocuments: mocks.getExpenseDocuments,
}));

import CollectionMonthPage from "./page";
import CollectionMonthNotFound from "./not-found";
import CollectionMonthReportsPage from "./reports/page";

describe("Collection Month route states", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["dashboard", CollectionMonthPage],
    ["reports", CollectionMonthReportsPage],
  ])(
    "routes a malformed Collection Month to not-found before loading %s data",
    async (_, Page) => {
      await expect(
        Page({ params: Promise.resolve({ month: "not-a-month" }) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");

      expect(mocks.notFound).toHaveBeenCalledOnce();
      expect(mocks.authToken).not.toHaveBeenCalled();
      expect(mocks.fetchQuery).not.toHaveBeenCalled();
      expect(mocks.getExpenseDocuments).not.toHaveBeenCalled();
    },
  );

  it("renders the Collection Month recovery action", () => {
    render(<CollectionMonthNotFound />);

    expect(screen.getByText("Collection Month not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open June 2026" }),
    ).toHaveAttribute("href", "/m/2026-06");
  });
});
