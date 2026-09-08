import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { app } from "./app";
import {
  APPLICANT_AUTH_COOKIE_NAME,
  signApplicantToken,
} from "./applicant-auth";
import { db } from "./db";
import {
  applicants,
  applicationChoices,
  applicationDocuments,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
  positions,
} from "./db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for applicant editing tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Applicant editing tests require a test database.");
}

process.env.APPLICANT_AUTH_SECRET =
  "applicant-editing-test-secret-at-least-32-characters";
process.env.EMAIL_ENABLED = "false";

const futureDeadline = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
process.env.APPLICATION_EDIT_DEADLINE = futureDeadline();

const committeeAId = randomUUID();
const committeeBId = randomUUID();
const positionA1Id = randomUUID();
const positionA2Id = randomUUID();
const positionB1Id = randomUUID();
const positionB2Id = randomUUID();
const applicantId = randomUUID();
const blockerApplicantId = randomUUID();
const applicationId = randomUUID();
const blockerApplicationId = randomUUID();
const slotAId = randomUUID();
const slotBId = randomUUID();
const occupiedSlotBId = randomUUID();
const applicationCode = "AP-2096-600001";

const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
startsAt.setUTCMinutes(0, 0, 0);

let applicantToken = "";

after(async () => {
  try {
    await db
      .delete(applicants)
      .where(inArray(applicants.id, [applicantId, blockerApplicantId]));
    await db
      .delete(committees)
      .where(inArray(committees.id, [committeeAId, committeeBId]));
  } finally {
    await db.$client.end();
  }
});

function applicantRequest(
  path: string,
  method = "GET",
  body?: Record<string, unknown>,
) {
  return app.request(path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      Cookie: `${APPLICANT_AUTH_COOKIE_NAME}=${applicantToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function responseError(response: Response): Promise<string> {
  const payload = (await response.json()) as { error: string };
  return payload.error;
}

function baseEditBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Original",
    lastName: "Applicant",
    age: 20,
    section: "TEST-1",
    motivation: "Original motivation",
    choices: [
      { positionId: positionA1Id, preferenceRank: 1 },
      { positionId: positionB1Id, preferenceRank: 2 },
    ],
    ...overrides,
  };
}

async function resetApplication() {
  process.env.APPLICATION_EDIT_DEADLINE = futureDeadline();
  await db
    .delete(interviewBookings)
    .where(eq(interviewBookings.applicationId, applicationId));
  await db
    .delete(applicationChoices)
    .where(eq(applicationChoices.applicationId, applicationId));
  await db.insert(applicationChoices).values([
    {
      applicationId,
      positionId: positionA1Id,
      preferenceRank: 1,
    },
    {
      applicationId,
      positionId: positionB1Id,
      preferenceRank: 2,
    },
  ]);
  await db
    .update(applications)
    .set({
      status: "pending",
      motivation: "Original motivation",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
      resultsReleasedAt: null,
      resultsReleasedBy: null,
      reviewedAt: null,
      reviewedBy: null,
    })
    .where(eq(applications.id, applicationId));
  await db
    .update(applicants)
    .set({
      firstName: "Original",
      lastName: "Applicant",
      email: `editing-${applicationId}@ust.edu.ph`,
      age: 20,
      section: "TEST-1",
    })
    .where(eq(applicants.id, applicantId));
  await db.insert(interviewBookings).values({
    applicationId,
    slotId: slotAId,
  });
}

async function currentState() {
  const [applicant] = await db
    .select({ firstName: applicants.firstName, email: applicants.email })
    .from(applicants)
    .where(eq(applicants.id, applicantId));
  const [application] = await db
    .select({ motivation: applications.motivation })
    .from(applications)
    .where(eq(applications.id, applicationId));
  const choices = await db
    .select({
      preferenceRank: applicationChoices.preferenceRank,
      positionId: applicationChoices.positionId,
    })
    .from(applicationChoices)
    .where(eq(applicationChoices.applicationId, applicationId));
  const [booking] = await db
    .select({ slotId: interviewBookings.slotId })
    .from(interviewBookings)
    .where(eq(interviewBookings.applicationId, applicationId));
  return {
    applicant,
    application,
    choices: choices.sort((a, b) => a.preferenceRank - b.preferenceRank),
    booking,
  };
}

test("applicant editing", async (t) => {
  await db.insert(committees).values([
    { id: committeeAId, name: `Editing Committee A ${applicationId}` },
    { id: committeeBId, name: `Editing Committee B ${applicationId}` },
  ]);
  await db.insert(positions).values([
    { id: positionA1Id, committeeId: committeeAId, name: "Editing A1" },
    { id: positionA2Id, committeeId: committeeAId, name: "Editing A2" },
    { id: positionB1Id, committeeId: committeeBId, name: "Editing B1" },
    { id: positionB2Id, committeeId: committeeBId, name: "Editing B2" },
  ]);
  await db.insert(applicants).values([
    {
      id: applicantId,
      firstName: "Original",
      lastName: "Applicant",
      email: `editing-${applicationId}@ust.edu.ph`,
      age: 20,
      section: "TEST-1",
    },
    {
      id: blockerApplicantId,
      firstName: "Slot",
      lastName: "Owner",
      email: `editing-${blockerApplicationId}@ust.edu.ph`,
      age: 20,
      section: "TEST-2",
    },
  ]);
  await db.insert(applications).values([
    {
      id: applicationId,
      applicantId,
      applicationCode,
      recruitmentYear: 2096,
      motivation: "Original motivation",
    },
    {
      id: blockerApplicationId,
      applicantId: blockerApplicantId,
      applicationCode: "AP-2096-600002",
      recruitmentYear: 2096,
      motivation: "Slot owner",
    },
  ]);
  await db.insert(applicationChoices).values([
    { applicationId, positionId: positionA1Id, preferenceRank: 1 },
    { applicationId, positionId: positionB1Id, preferenceRank: 2 },
    {
      applicationId: blockerApplicationId,
      positionId: positionB1Id,
      preferenceRank: 1,
    },
    {
      applicationId: blockerApplicationId,
      positionId: positionA1Id,
      preferenceRank: 2,
    },
  ]);
  await db.insert(applicationDocuments).values([
    {
      applicationId,
      documentType: "resume",
      fileName: "resume.pdf",
      s3Key: "private/resume.pdf",
    },
    {
      applicationId,
      documentType: "transcript",
      fileName: "transcript.pdf",
      s3Key: "private/transcript.pdf",
    },
  ]);
  await db.insert(interviewSlots).values([
    { id: slotAId, committeeId: committeeAId, startsAt },
    {
      id: slotBId,
      committeeId: committeeBId,
      startsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
    },
    {
      id: occupiedSlotBId,
      committeeId: committeeBId,
      startsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
    },
  ]);
  await db.insert(interviewBookings).values([
    { applicationId, slotId: slotAId },
    { applicationId: blockerApplicationId, slotId: occupiedSlotBId },
  ]);

  applicantToken = (
    await signApplicantToken({ applicationId, applicationCode })
  ).token;

  await t.test("requires a session and rejects locked fields", async () => {
    assert.equal((await app.request("/applicant/application")).status, 401);
    assert.equal(
      (
        await app.request("/applicant/application", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(baseEditBody()),
        })
      ).status,
      401,
    );

    const emailEdit = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({ email: "changed@ust.edu.ph" }),
    );
    assert.equal(emailEdit.status, 400);
    assert.match(await responseError(emailEdit), /cannot be changed/i);
  });

  await t.test("returns safe prefill data and edit eligibility", async () => {
    await resetApplication();
    const response = await applicantRequest("/applicant/application");
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      applicationCode: string;
      canEdit: boolean;
      editDeadline: string | null;
      choices: { positionId: string }[];
      documents: Record<string, unknown>[];
    };
    assert.equal(payload.applicationCode, applicationCode);
    assert.equal(payload.canEdit, true);
    assert.ok(payload.editDeadline);
    assert.equal(payload.choices[0].positionId, positionA1Id);
    assert.ok(payload.documents.every((document) => !("s3Key" in document)));
  });

  await t.test("previews slots for a proposed first choice", async () => {
    await resetApplication();
    const response = await applicantRequest(
      `/applicant/interview-slots?positionId=${positionB1Id}`,
    );
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      committee: { id: string };
      slots: { id: string }[];
    };
    assert.equal(payload.committee.id, committeeBId);
    assert.deepEqual(
      payload.slots.map((slot) => slot.id),
      [slotBId],
    );

    const invalid = await applicantRequest(
      "/applicant/interview-slots?positionId=invalid",
    );
    assert.equal(invalid.status, 400);
  });

  await t.test("updates allowed fields without replacing locked data", async () => {
    await resetApplication();
    const response = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({
        firstName: "Updated",
        motivation: "Updated motivation",
        choices: [
          { positionId: positionA2Id, preferenceRank: 1 },
          { positionId: positionB1Id, preferenceRank: 2 },
        ],
      }),
    );
    assert.equal(response.status, 200);

    const state = await currentState();
    assert.equal(state.applicant.firstName, "Updated");
    assert.equal(state.application.motivation, "Updated motivation");
    assert.equal(state.applicant.email, `editing-${applicationId}@ust.edu.ph`);
    assert.equal(state.choices[0].positionId, positionA2Id);
    assert.equal(state.booking.slotId, slotAId);

    const documents = await db
      .select({ s3Key: applicationDocuments.s3Key })
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, applicationId));
    assert.deepEqual(
      documents.map((document) => document.s3Key).sort(),
      ["private/resume.pdf", "private/transcript.pdf"],
    );
  });

  await t.test("changes first committee and slot atomically", async () => {
    await resetApplication();
    const choices = [
      { positionId: positionB1Id, preferenceRank: 1 },
      { positionId: positionA1Id, preferenceRank: 2 },
    ];
    const missingSlot = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({ choices }),
    );
    assert.equal(missingSlot.status, 409);
    assert.match(await responseError(missingSlot), /new interview slot/i);

    const unchanged = await currentState();
    assert.equal(unchanged.choices[0].positionId, positionA1Id);
    assert.equal(unchanged.booking.slotId, slotAId);

    const updated = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({ choices, slotId: slotBId }),
    );
    assert.equal(updated.status, 200);
    const changed = await currentState();
    assert.equal(changed.choices[0].positionId, positionB1Id);
    assert.equal(changed.booking.slotId, slotBId);
  });

  await t.test("rolls back every field when the slot is invalid", async () => {
    await resetApplication();
    const choices = [
      { positionId: positionB1Id, preferenceRank: 1 },
      { positionId: positionA1Id, preferenceRank: 2 },
    ];
    const wrongCommittee = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({
        firstName: "Should Roll Back",
        motivation: "Should roll back",
        choices,
        slotId: slotAId,
      }),
    );
    assert.equal(wrongCommittee.status, 409);

    const occupied = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody({ choices, slotId: occupiedSlotBId }),
    );
    assert.equal(occupied.status, 409);

    const state = await currentState();
    assert.equal(state.applicant.firstName, "Original");
    assert.equal(state.application.motivation, "Original motivation");
    assert.equal(state.choices[0].positionId, positionA1Id);
    assert.equal(state.booking.slotId, slotAId);
  });

  await t.test("locks edits after the deadline or HR review", async () => {
    await resetApplication();
    process.env.APPLICATION_EDIT_DEADLINE = new Date(
      Date.now() - 60 * 1000,
    ).toISOString();
    const expired = await applicantRequest("/applicant/application");
    const expiredPayload = (await expired.json()) as {
      canEdit: boolean;
      lockReason: string;
    };
    assert.equal(expiredPayload.canEdit, false);
    assert.match(expiredPayload.lockReason, /deadline has passed/i);
    const expiredSchedule = await applicantRequest(
      "/applicant/interview-slots",
    );
    const schedulePayload = (await expiredSchedule.json()) as {
      canSchedule: boolean;
      lockReason: string;
    };
    assert.equal(schedulePayload.canSchedule, false);
    assert.match(schedulePayload.lockReason, /deadline has passed/i);
    assert.equal(
      (
        await applicantRequest(
          "/applicant/application",
          "PATCH",
          baseEditBody(),
        )
      ).status,
      409,
    );

    await resetApplication();
    await db
      .update(applicationChoices)
      .set({ decisionStatus: "approved", decidedAt: new Date() })
      .where(
        and(
          eq(applicationChoices.applicationId, applicationId),
          eq(applicationChoices.preferenceRank, 2),
        ),
      );
    const reviewed = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody(),
    );
    assert.equal(reviewed.status, 409);
    assert.match(await responseError(reviewed), /review has started/i);
  });

  await t.test("fails closed when the deadline is not configured", async () => {
    await resetApplication();
    delete process.env.APPLICATION_EDIT_DEADLINE;
    const view = await applicantRequest("/applicant/application");
    const payload = (await view.json()) as {
      canEdit: boolean;
      lockReason: string;
    };
    assert.equal(payload.canEdit, false);
    assert.match(payload.lockReason, /not configured/i);

    const update = await applicantRequest(
      "/applicant/application",
      "PATCH",
      baseEditBody(),
    );
    assert.equal(update.status, 503);
  });
});
