import assert from "node:assert/strict";
import test from "node:test";
import { getRecruitmentSeasonStatus } from "./window";

test("getRecruitmentSeasonStatus reflects the recruitment window interval", async (t) => {
  const startsAt = new Date("2026-06-01T00:00:00.000Z");
  const endsAt = new Date("2026-06-08T00:00:00.000Z");
  const window = { startsAt, endsAt };

  await t.test("not configured", () => {
    const status = getRecruitmentSeasonStatus(null);
    assert.equal(status.open, false);
    assert.equal(status.code, "not_configured");
  });

  await t.test("not started", () => {
    const status = getRecruitmentSeasonStatus(
      window,
      new Date("2026-05-31T23:59:59.000Z"),
    );
    assert.equal(status.open, false);
    assert.equal(status.code, "recruitment_not_started");
  });

  await t.test("open during the window", () => {
    const status = getRecruitmentSeasonStatus(
      window,
      new Date("2026-06-02T12:00:00.000Z"),
    );
    assert.equal(status.open, true);
    assert.equal(status.code, null);
  });

  await t.test("closed at endsAt", () => {
    const status = getRecruitmentSeasonStatus(window, endsAt);
    assert.equal(status.open, false);
    assert.equal(status.code, "deadline_passed");
  });
});
