import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getCollectionMonthRange,
  isCollectionMonth,
  isTimestampInCollectionMonth,
  shiftCollectionMonth,
  toCollectionMonthValue,
} from "./collectionMonth.js";

describe("collection month utilities", () => {
  it("validates canonical collection month values", () => {
    assert.equal(isCollectionMonth("2026-01"), true);
    assert.equal(isCollectionMonth("2026-12"), true);
    assert.equal(isCollectionMonth("2026-00"), false);
    assert.equal(isCollectionMonth("2026-13"), false);
    assert.equal(isCollectionMonth("2026-1"), false);
  });

  it("formats dates using UTC month boundaries", () => {
    assert.equal(
      toCollectionMonthValue(new Date("2026-01-31T23:59:59.000Z")),
      "2026-01",
    );
  });

  it("shifts across year boundaries", () => {
    assert.equal(shiftCollectionMonth("2026-01", -1), "2025-12");
    assert.equal(shiftCollectionMonth("2026-12", 1), "2027-01");
  });

  it("returns inclusive start and exclusive end ranges", () => {
    assert.deepEqual(getCollectionMonthRange("2026-02"), {
      startMs: Date.UTC(2026, 1, 1),
      endExclusiveMs: Date.UTC(2026, 2, 1),
    });
    assert.equal(
      isTimestampInCollectionMonth(Date.UTC(2026, 1, 1), "2026-02"),
      true,
    );
    assert.equal(
      isTimestampInCollectionMonth(Date.UTC(2026, 2, 1), "2026-02"),
      false,
    );
  });

  it("rejects invalid months for range operations", () => {
    assert.throws(() => shiftCollectionMonth("2026-13", 1), {
      message: "INVALID_COLLECTION_MONTH",
    });
    assert.throws(() => getCollectionMonthRange("not-a-month"), {
      message: "INVALID_COLLECTION_MONTH",
    });
  });
});
