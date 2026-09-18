import assert from "node:assert/strict";
import test from "node:test";
import { dueInterviewReminder } from "./reminder-policy";

const now = new Date("2026-09-13T00:00:00.000Z");

test("selects the next unsent interview reminder", () => {
  assert.equal(
    dueInterviewReminder({
      startsAt: new Date("2026-09-13T23:00:00.000Z"),
      reminder24hSentAt: null,
      reminder1hSentAt: null,
      now,
    }),
    "24h",
  );
  assert.equal(
    dueInterviewReminder({
      startsAt: new Date("2026-09-13T00:45:00.000Z"),
      reminder24hSentAt: new Date("2026-09-12T01:00:00.000Z"),
      reminder1hSentAt: null,
      now,
    }),
    "1h",
  );
});

test("does not repeat reminders or notify outside the reminder window", () => {
  assert.equal(
    dueInterviewReminder({
      startsAt: new Date("2026-09-13T23:00:00.000Z"),
      reminder24hSentAt: new Date("2026-09-13T00:00:00.000Z"),
      reminder1hSentAt: null,
      now,
    }),
    null,
  );
  assert.equal(
    dueInterviewReminder({
      startsAt: new Date("2026-09-14T00:00:01.000Z"),
      reminder24hSentAt: null,
      reminder1hSentAt: null,
      now,
    }),
    null,
  );
  assert.equal(
    dueInterviewReminder({
      startsAt: new Date("2026-09-12T23:59:59.000Z"),
      reminder24hSentAt: null,
      reminder1hSentAt: null,
      now,
    }),
    null,
  );
});
