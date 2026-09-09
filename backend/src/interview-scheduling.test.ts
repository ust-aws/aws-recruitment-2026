import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { app } from "./app";
import {
  APPLICANT_AUTH_COOKIE_NAME,
  signApplicantToken,
} from "./applicant-auth";
import { signToken } from "./auth";
import { db } from "./db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
  positions,
  recruitmentWindows,
} from "./db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for interview scheduling tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Interview scheduling tests require a test database.");
}

process.env.JWT_SECRET = "interview-scheduling-hr-secret-at-least-32-characters";
process.env.APPLICANT_AUTH_SECRET =
  "interview-scheduling-applicant-secret-at-least-32";
process.env.EMAIL_ENABLED = "false";

const runId = randomUUID();
const committeeAId = randomUUID();
const committeeBId = randomUUID();
const positionAId = randomUUID();
const positionBId = randomUUID();
const applicantIds = [randomUUID(), randomUUID(), randomUUID()];
const applicationIds = [randomUUID(), randomUUID(), randomUUID()];
const applicationCodes = [
  "AP-2097-510001",
  "AP-2097-510002",
  "AP-2097-510003",
];

const baseStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
baseStart.setUTCMinutes(0, 0, 0);
const at = (halfHours: number) =>
  new Date(baseStart.getTime() + halfHours * 30 * 60 * 1000);

let hrToken = "";
const applicantTokens: string[] = [];
let slotA1Id = "";
let slotA2Id = "";
let slotB1Id = "";
let closedSlotId = "";

after(async () => {
  try {
    await db.delete(applicants).where(inArray(applicants.id, applicantIds));
    await db
      .delete(committees)
      .where(inArray(committees.id, [committeeAId, committeeBId]));
  } finally {
    await db.$client.end();
  }
});

function jsonRequest(
  path: string,
  method: string,
  body: Record<string, unknown> | undefined,
  headers: Record<string, string>,
) {
  return app.request(path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function hrRequest(
  path: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return jsonRequest(path, method, body, {
    Authorization: `Bearer ${hrToken}`,
  });
}

function applicantRequest(
  index: number,
  path: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return jsonRequest(path, method, body, {
    Cookie: `${APPLICANT_AUTH_COOKIE_NAME}=${applicantTokens[index]}`,
  });
}

async function createSlot(committeeId: string, startsAt: Date) {
  const response = await hrRequest("/interview-slots", "POST", {
    committeeId,
    startsAt: startsAt.toISOString(),
  });
  assert.equal(response.status, 201);
  return (await response.json()) as {
    id: string;
    startsAt: string;
    endsAt: string;
  };
}

test("interview scheduling backend", async (t) => {
  const windowStart = new Date(Date.now() - 60 * 1000);
  const windowEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db
    .insert(recruitmentWindows)
    .values({
      singleton: 1,
      startsAt: windowStart,
      endsAt: windowEnd,
    })
    .onConflictDoUpdate({
      target: recruitmentWindows.singleton,
      set: { startsAt: windowStart, endsAt: windowEnd },
    });

  await db.insert(committees).values([
    { id: committeeAId, name: `Scheduling A ${runId}` },
    { id: committeeBId, name: `Scheduling B ${runId}` },
  ]);
  await db.insert(positions).values([
    {
      id: positionAId,
      committeeId: committeeAId,
      name: "Scheduling Position A",
    },
    {
      id: positionBId,
      committeeId: committeeBId,
      name: "Scheduling Position B",
    },
  ]);
  await db.insert(applicants).values(
    applicantIds.map((id, index) => ({
      id,
      firstName: `Schedule${index + 1}`,
      lastName: "Applicant",
      email: `schedule-${runId}-${index + 1}@ust.edu.ph`,
      age: 20,
      section: "TEST-1",
    })),
  );
  await db.insert(applications).values(
    applicationIds.map((id, index) => ({
      id,
      applicantId: applicantIds[index],
      applicationCode: applicationCodes[index],
      recruitmentYear: 2097,
      motivation: "Interview scheduling integration test",
    })),
  );
  await db.insert(applicationChoices).values(
    applicationIds.flatMap((applicationId, index) => {
      const first = index === 2 ? positionBId : positionAId;
      const second = index === 2 ? positionAId : positionBId;
      return [
        { applicationId, positionId: first, preferenceRank: 1 },
        { applicationId, positionId: second, preferenceRank: 2 },
      ];
    }),
  );

  hrToken = (await signToken("scheduling-hr@aws-ust.org")).token;
  for (let index = 0; index < applicationIds.length; index += 1) {
    applicantTokens.push(
      (
        await signApplicantToken({
          applicationId: applicationIds[index],
          applicationCode: applicationCodes[index],
        })
      ).token,
    );
  }

  await t.test("requires the correct session and validates slot input", async () => {
    assert.equal((await app.request("/interview-slots")).status, 401);
    assert.equal(
      (await app.request("/applicant/interview-slots")).status,
      401,
    );

    const malformed = await hrRequest("/interview-slots", "POST", {
      committeeId: "not-a-uuid",
      startsAt: "tomorrow",
    });
    assert.equal(malformed.status, 400);

    const misaligned = await hrRequest("/interview-slots", "POST", {
      committeeId: committeeAId,
      startsAt: new Date(at(0).getTime() + 15 * 60 * 1000).toISOString(),
    });
    assert.equal(misaligned.status, 400);
  });

  await t.test("lets HR create, list, and close committee slots", async () => {
    const slotA1 = await createSlot(committeeAId, at(0));
    const slotA2 = await createSlot(committeeAId, at(1));
    const slotB1 = await createSlot(committeeBId, at(0));
    const closed = await createSlot(committeeAId, at(2));
    slotA1Id = slotA1.id;
    slotA2Id = slotA2.id;
    slotB1Id = slotB1.id;
    closedSlotId = closed.id;

    assert.equal(
      new Date(slotA1.endsAt).getTime() -
        new Date(slotA1.startsAt).getTime(),
      30 * 60 * 1000,
    );

    const duplicate = await hrRequest("/interview-slots", "POST", {
      committeeId: committeeAId,
      startsAt: at(0).toISOString(),
    });
    assert.equal(duplicate.status, 409);

    const close = await hrRequest(
      `/interview-slots/${closedSlotId}`,
      "PATCH",
      { isOpen: false },
    );
    assert.equal(close.status, 200);

    const list = await hrRequest(
      `/interview-slots?committeeId=${committeeAId}&from=${encodeURIComponent(
        at(0).toISOString(),
      )}&to=${encodeURIComponent(at(3).toISOString())}`,
    );
    assert.equal(list.status, 200);
    const payload = (await list.json()) as { slots: { id: string }[] };
    assert.deepEqual(
      payload.slots.map((slot) => slot.id),
      [slotA1Id, slotA2Id, closedSlotId],
    );
  });

  await t.test("shows only open first-choice committee availability", async () => {
    const response = await applicantRequest(
      0,
      "/applicant/interview-slots",
    );
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      committee: { id: string };
      canSchedule: boolean;
      booking: unknown;
      slots: { id: string }[];
    };
    assert.equal(payload.committee.id, committeeAId);
    assert.equal(payload.canSchedule, true);
    assert.equal(payload.booking, null);
    assert.deepEqual(
      payload.slots.map((slot) => slot.id),
      [slotA1Id, slotA2Id],
    );
  });

  await t.test("books and atomically reschedules one application", async () => {
    const wrongCommittee = await applicantRequest(
      0,
      "/applicant/interview-booking",
      "PUT",
      { slotId: slotB1Id },
    );
    assert.equal(wrongCommittee.status, 409);

    const booked = await applicantRequest(
      0,
      "/applicant/interview-booking",
      "PUT",
      { slotId: slotA1Id },
    );
    assert.equal(booked.status, 200);
    const bookedPayload = (await booked.json()) as {
      booking: { rescheduled: boolean };
    };
    assert.equal(bookedPayload.booking.rescheduled, false);

    const occupied = await applicantRequest(
      1,
      "/applicant/interview-booking",
      "PUT",
      { slotId: slotA1Id },
    );
    assert.equal(occupied.status, 409);

    const closeBooked = await hrRequest(
      `/interview-slots/${slotA1Id}`,
      "PATCH",
      { isOpen: false },
    );
    assert.equal(closeBooked.status, 409);

    const rescheduled = await applicantRequest(
      0,
      "/applicant/interview-booking",
      "PUT",
      { slotId: slotA2Id },
    );
    assert.equal(rescheduled.status, 200);
    const rescheduledPayload = (await rescheduled.json()) as {
      booking: { slotId: string; rescheduled: boolean };
    };
    assert.equal(rescheduledPayload.booking.slotId, slotA2Id);
    assert.equal(rescheduledPayload.booking.rescheduled, true);

    const rows = await db
      .select({ slotId: interviewBookings.slotId })
      .from(interviewBookings)
      .where(eq(interviewBookings.applicationId, applicationIds[0]));
    assert.deepEqual(rows, [{ slotId: slotA2Id }]);
  });

  await t.test("locks scheduling as soon as HR review starts", async () => {
    await db
      .update(applicationChoices)
      .set({ decisionStatus: "approved", decidedAt: new Date() })
      .where(
        and(
          eq(applicationChoices.applicationId, applicationIds[0]),
          eq(applicationChoices.preferenceRank, 2),
        ),
      );

    const response = await applicantRequest(
      0,
      "/applicant/interview-booking",
      "PUT",
      { slotId: slotA1Id },
    );
    assert.equal(response.status, 409);

    const schedule = await applicantRequest(
      0,
      "/applicant/interview-slots",
    );
    const payload = (await schedule.json()) as {
      canSchedule: boolean;
      lockReason: string | null;
      slots: unknown[];
    };
    assert.equal(payload.canSchedule, false);
    assert.match(payload.lockReason ?? "", /review has started/i);
    assert.deepEqual(payload.slots, []);
  });

  await t.test("enforces slot and booking uniqueness in PostgreSQL", async () => {
    await assert.rejects(async () => {
      await db.insert(interviewSlots).values({
        committeeId: committeeAId,
        startsAt: new Date(at(3).getTime() + 15 * 60 * 1000),
      });
    });

    await assert.rejects(async () => {
      await db.insert(interviewSlots).values({
        committeeId: committeeAId,
        startsAt: at(0),
      });
    });

    await db.insert(interviewBookings).values({
      applicationId: applicationIds[1],
      slotId: slotA1Id,
    });

    await assert.rejects(async () => {
      await db.insert(interviewBookings).values({
        applicationId: applicationIds[2],
        slotId: slotA1Id,
      });
    });

    await assert.rejects(async () => {
      await db.insert(interviewBookings).values({
        applicationId: applicationIds[1],
        slotId: slotB1Id,
      });
    });
  });
});
