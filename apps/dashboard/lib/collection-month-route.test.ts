import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

import { getCollectionMonthRoute } from "./collection-month-route";

describe("getCollectionMonthRoute", () => {
  beforeEach(() => {
    mocks.notFound.mockClear();
  });

  it("returns route information for a valid Collection Month", () => {
    const monthInfo = getCollectionMonthRoute("2026-06");

    expect(monthInfo.value).toBe("2026-06");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("uses the route not-found state for a malformed Collection Month", () => {
    expect(() => getCollectionMonthRoute("not-a-month")).toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
