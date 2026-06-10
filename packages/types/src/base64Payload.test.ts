import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeBase64Payload } from "./base64Payload.js";

describe("base64 payload normalization", () => {
  it("strips data URL prefixes", () => {
    assert.equal(
      normalizeBase64Payload("data:application/pdf;base64,SGVsbG8="),
      "SGVsbG8="
    );
  });

  it("normalizes base64url input and restores padding", () => {
    assert.equal(normalizeBase64Payload("SGVsbG8"), "SGVsbG8=");
    assert.equal(normalizeBase64Payload("--__"), "++//");
  });

  it("rejects invalid base64 lengths before decoding", () => {
    assert.throws(
      () => normalizeBase64Payload("abcde"),
      /Invalid base64 payload length/
    );
  });
});
