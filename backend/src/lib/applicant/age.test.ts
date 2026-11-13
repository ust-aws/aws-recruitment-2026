import assert from "node:assert/strict";
import test from "node:test";
import { ageOn } from "./age";

test("age counts whole years and turns over on the birthday", () => {
  const today = new Date("2026-11-11T00:00:00.000Z");
  assert.equal(ageOn("2005-01-26", today), 21);
  assert.equal(ageOn("2006-05-21", today), 20);
  assert.equal(ageOn("2005-03-10", today), 21);
  assert.equal(ageOn("2005-11-11", today), 21);
  assert.equal(ageOn("2005-11-12", today), 20);
});
