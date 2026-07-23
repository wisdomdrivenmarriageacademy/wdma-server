import assert from "node:assert/strict";
import test from "node:test";
import { toSubunit } from "./paystack";

test("converts a decimal amount to Paystack subunits", () => {
  assert.equal(toSubunit(1250.5), 125050);
});
