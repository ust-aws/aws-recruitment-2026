import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { app } from "./app";
import { signToken } from "./auth";
import { db } from "./db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  emailNotifications,
  positions,
  users,
} from "./db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for results preview tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Results preview tests require a test database.");
}

process.env.JWT_SECRET = "results-preview-secret-at-least-32-characters";
process.env.RECRUITMENT_YEAR = "2095";
process.env.EMAIL_ENABLED = "false";

const runId = randomUUID();
const hrUserId = randomUUID();
const hrEmail = `results-hr-${runId}@aws-ust.org`;
const committeeAId = randomUUID();
const committeeBId = randomUUID();
const positionAId = randomUUID();
const positionBId = randomUUID();
const applicantIds = Array.from({ length: 7 }, () => randomUUID());
const applicationIds = Array.from({ length: 7 }, () => randomUUID());
const applicationCodes = applicationIds.map(
  (_, index) => `AP-2095-${String(610001 + index).padStart(6, "0")}`,
);
const decidedAt = new Date("2095-01-01T00:00:00.000Z");

let hrToken = "";

after(async () => {
  try {
    await db.delete(applicants).where(inArray(applicants.id, applicantIds));
    await db.delete(users).where(eq(users.id, hrUserId));
    await db
      .delete(committees)
      .where(inArray(committees.id, [committeeAId, committeeBId]));
  } finally {
    await db.$client.end();
  }
});

function hrRequest() {
  return app.request("/results/preview", {
    headers: { Authorization: `Bearer ${hrToken}` },
  });
}

function releaseRequest() {
  return app.request("/results/release", {
    method: "POST",
    headers: { Authorization: `Bearer ${hrToken}` },
  });
}

function retryFailedEmailsRequest() {
  return app.request("/results/emails/retry-failed", {
    method: "POST",
    headers: { Authorization: `Bearer ${hrToken}` },
  });
}

function decisionValues(
  applicationId: string,
  first: "pending" | "approved" | "rejected",
  second: "pending" | "approved" | "rejected",
) {
  return [first, second].map((decisionStatus, index) => ({
    applicationId,
    positionId: index === 0 ? positionAId : positionBId,
    preferenceRank: (index + 1) as 1 | 2,
    decisionStatus,
    decidedAt: decisionStatus === "pending" ? null : decidedAt,
  }));
}

test("results release preview", async (t) => {
  await db.insert(users).values({
    id: hrUserId,
    email: hrEmail,
    passwordHash: "test-only",
    firstName: "Results",
    lastName: "Reviewer",
  });
  await db.insert(committees).values([
    { id: committeeAId, name: `Results A ${runId}` },
    { id: committeeBId, name: `Results B ${runId}` },
  ]);
  await db.insert(positions).values([
    {
      id: positionAId,
      committeeId: committeeAId,
      name: "Results Position A",
    },
    {
      id: positionBId,
      committeeId: committeeBId,
      name: "Results Position B",
    },
  ]);
  await db.insert(applicants).values(
    applicantIds.map((id, index) => ({
      id,
      firstName: `Results${index + 1}`,
      lastName: "Applicant",
      email: `results-${runId}-${index + 1}@ust.edu.ph`,
      age: 20,
      section: "TEST-1",
    })),
  );
  await db.insert(applications).values([
    {
      id: applicationIds[0],
      applicantId: applicantIds[0],
      applicationCode: applicationCodes[0],
      recruitmentYear: 2095,
      motivation: "Accepted preview test",
      finalPositionId: positionAId,
    },
    {
      id: applicationIds[1],
      applicantId: applicantIds[1],
      applicationCode: applicationCodes[1],
      recruitmentYear: 2095,
      motivation: "Rejected preview test",
    },
    {
      id: applicationIds[2],
      applicantId: applicantIds[2],
      applicationCode: applicationCodes[2],
      recruitmentYear: 2095,
      motivation: "Pending decision preview test",
    },
    {
      id: applicationIds[3],
      applicantId: applicantIds[3],
      applicationCode: applicationCodes[3],
      recruitmentYear: 2095,
      motivation: "Missing placement preview test",
    },
    {
      id: applicationIds[4],
      applicantId: applicantIds[4],
      applicationCode: applicationCodes[4],
      recruitmentYear: 2095,
      motivation: "Invalid placement preview test",
      finalPositionId: positionBId,
    },
    {
      id: applicationIds[5],
      applicantId: applicantIds[5],
      applicationCode: applicationCodes[5],
      recruitmentYear: 2095,
      motivation: "Released preview test",
      status: "approved",
      finalPositionId: positionAId,
      memberId: "AWS-2095-0001",
      resultsReleasedAt: new Date("2095-02-01T00:00:00.000Z"),
    },
    {
      id: applicationIds[6],
      applicantId: applicantIds[6],
      applicationCode: applicationCodes[6],
      recruitmentYear: 2095,
      motivation: "Archived preview test",
      archivedAt: new Date("2095-02-02T00:00:00.000Z"),
    },
  ]);
  await db.insert(applicationChoices).values([
    ...decisionValues(applicationIds[0], "approved", "rejected"),
    ...decisionValues(applicationIds[1], "rejected", "rejected"),
    ...decisionValues(applicationIds[2], "approved", "pending"),
    ...decisionValues(applicationIds[3], "approved", "rejected"),
    ...decisionValues(applicationIds[4], "approved", "rejected"),
    ...decisionValues(applicationIds[5], "approved", "rejected"),
    ...decisionValues(applicationIds[6], "pending", "pending"),
  ]);

  hrToken = (await signToken(hrEmail)).token;

  await t.test("requires HR authentication", async () => {
    assert.equal((await app.request("/results/preview")).status, 401);
    assert.equal(
      (
        await app.request("/results/release", {
          method: "POST",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await app.request("/results/emails/retry-failed", {
          method: "POST",
        })
      ).status,
      401,
    );
  });

  await t.test("classifies the pending release batch", async () => {
    const response = await hrRequest();
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      recruitmentYear: number;
      summary: {
        pendingRelease: number;
        accepted: number;
        rejected: number;
        incomplete: number;
        alreadyReleased: number;
        archived: number;
        canRelease: boolean;
      };
      applications: {
        id: string;
        applicationCode: string;
        applicant: { fullName: string; email: string };
        classification: "accepted" | "rejected" | "incomplete";
        blockingReason: string | null;
        finalPlacement: { positionId: string } | null;
        choices: {
          preferenceRank: number;
          positionId: string;
          decisionStatus: string;
        }[];
        willGenerateMemberId: boolean;
        willSendEmail: boolean;
      }[];
    };

    assert.equal(payload.recruitmentYear, 2095);
    assert.deepEqual(payload.summary, {
      pendingRelease: 5,
      accepted: 1,
      rejected: 1,
      incomplete: 3,
      alreadyReleased: 1,
      archived: 1,
      canRelease: false,
    });
    assert.deepEqual(
      payload.applications.map((application) => application.id).sort(),
      applicationIds.slice(0, 5).sort(),
    );

    const byId = new Map(
      payload.applications.map((application) => [application.id, application]),
    );
    assert.equal(byId.get(applicationIds[0])?.classification, "accepted");
    assert.equal(
      byId.get(applicationIds[0])?.finalPlacement?.positionId,
      positionAId,
    );
    assert.equal(byId.get(applicationIds[0])?.willGenerateMemberId, true);
    assert.equal(byId.get(applicationIds[0])?.willSendEmail, true);
    assert.equal(byId.get(applicationIds[1])?.classification, "rejected");
    assert.equal(byId.get(applicationIds[1])?.willGenerateMemberId, false);
    assert.equal(byId.get(applicationIds[1])?.willSendEmail, true);
    assert.match(
      byId.get(applicationIds[2])?.blockingReason ?? "",
      /decisions must be completed/i,
    );
    assert.match(
      byId.get(applicationIds[3])?.blockingReason ?? "",
      /final placement is required/i,
    );
    assert.match(
      byId.get(applicationIds[4])?.blockingReason ?? "",
      /approved position choice/i,
    );
    assert.equal(byId.get(applicationIds[2])?.willSendEmail, false);
    assert.deepEqual(
      byId
        .get(applicationIds[0])
        ?.choices.map((choice) => choice.preferenceRank),
      [1, 2],
    );
    assert.doesNotMatch(JSON.stringify(payload), /s3Key|documents/i);
  });

  await t.test("does not modify records or queue emails", async () => {
    const beforeApplications = await db
      .select({
        id: applications.id,
        status: applications.status,
        finalPositionId: applications.finalPositionId,
        memberId: applications.memberId,
        resultsReleasedAt: applications.resultsReleasedAt,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(inArray(applications.id, applicationIds));
    const beforeNotifications = await db
      .select({ id: emailNotifications.id })
      .from(emailNotifications)
      .where(inArray(emailNotifications.applicationId, applicationIds));

    assert.equal((await hrRequest()).status, 200);

    const afterApplications = await db
      .select({
        id: applications.id,
        status: applications.status,
        finalPositionId: applications.finalPositionId,
        memberId: applications.memberId,
        resultsReleasedAt: applications.resultsReleasedAt,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(inArray(applications.id, applicationIds));
    const afterNotifications = await db
      .select({ id: emailNotifications.id })
      .from(emailNotifications)
      .where(inArray(emailNotifications.applicationId, applicationIds));

    assert.deepEqual(afterApplications, beforeApplications);
    assert.deepEqual(afterNotifications, beforeNotifications);
  });

  await t.test("refuses to release an incomplete batch", async () => {
    const response = await releaseRequest();
    assert.equal(response.status, 409);

    const payload = (await response.json()) as {
      error: string;
      incomplete: number;
    };
    assert.match(payload.error, /incomplete/i);
    assert.equal(payload.incomplete, 3);

    const unchanged = await db
      .select({
        id: applications.id,
        memberId: applications.memberId,
        resultsReleasedAt: applications.resultsReleasedAt,
      })
      .from(applications)
      .where(inArray(applications.id, applicationIds.slice(0, 5)));
    assert.ok(unchanged.every((row) => row.memberId === null));
    assert.ok(unchanged.every((row) => row.resultsReleasedAt === null));
  });

  await t.test("allows release only after all blocking records are fixed", async () => {
    await db
      .update(applicationChoices)
      .set({ decisionStatus: "rejected", decidedAt })
      .where(
        and(
          eq(applicationChoices.applicationId, applicationIds[2]),
          eq(applicationChoices.preferenceRank, 2),
        ),
      );
    await db
      .update(applications)
      .set({ finalPositionId: positionAId })
      .where(
        inArray(applications.id, [
          applicationIds[2],
          applicationIds[3],
          applicationIds[4],
        ]),
      );

    const response = await hrRequest();
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      summary: {
        pendingRelease: number;
        accepted: number;
        rejected: number;
        incomplete: number;
        alreadyReleased: number;
        archived: number;
        canRelease: boolean;
      };
      applications: {
        applicationCode: string;
        classification: "accepted" | "rejected" | "incomplete";
        blockingReason: string | null;
      }[];
    };
    assert.deepEqual(
      payload.applications
        .map(({ applicationCode, classification, blockingReason }) => ({
          applicationCode,
          classification,
          blockingReason,
        }))
        .sort((a, b) => a.applicationCode.localeCompare(b.applicationCode)),
      [
        {
          applicationCode: applicationCodes[0],
          classification: "accepted",
          blockingReason: null,
        },
        {
          applicationCode: applicationCodes[1],
          classification: "rejected",
          blockingReason: null,
        },
        {
          applicationCode: applicationCodes[2],
          classification: "accepted",
          blockingReason: null,
        },
        {
          applicationCode: applicationCodes[3],
          classification: "accepted",
          blockingReason: null,
        },
        {
          applicationCode: applicationCodes[4],
          classification: "accepted",
          blockingReason: null,
        },
      ],
    );
    assert.deepEqual(payload.summary, {
      pendingRelease: 5,
      accepted: 4,
      rejected: 1,
      incomplete: 0,
      alreadyReleased: 1,
      archived: 1,
      canRelease: true,
    });
  });

  await t.test("releases results and generates stable member IDs", async () => {
    const response = await releaseRequest();
    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      released: number;
      accepted: number;
      rejected: number;
      memberIdsGenerated: number;
      releasedAt: string;
      emailDelivery: {
        queued: number;
        sent: number;
        failed: number;
      };
    };
    assert.deepEqual(
      {
        released: payload.released,
        accepted: payload.accepted,
        rejected: payload.rejected,
        memberIdsGenerated: payload.memberIdsGenerated,
      },
      {
        released: 5,
        accepted: 4,
        rejected: 1,
        memberIdsGenerated: 4,
      },
    );
    assert.ok(Number.isFinite(Date.parse(payload.releasedAt)));
    assert.deepEqual(payload.emailDelivery, {
      queued: 5,
      sent: 0,
      failed: 5,
    });

    const released = await db
      .select({
        id: applications.id,
        status: applications.status,
        memberId: applications.memberId,
        resultsReleasedAt: applications.resultsReleasedAt,
        resultsReleasedBy: applications.resultsReleasedBy,
      })
      .from(applications)
      .where(inArray(applications.id, applicationIds.slice(0, 5)));
    const releasedById = new Map(released.map((row) => [row.id, row]));

    const acceptedIds = [
      applicationIds[0],
      applicationIds[2],
      applicationIds[3],
      applicationIds[4],
    ];
    const generatedMemberIds = acceptedIds.map(
      (id) => releasedById.get(id)?.memberId,
    );
    assert.ok(
      generatedMemberIds.every(
        (memberId) =>
          typeof memberId === "string" && /^AWS-2095-\d{4}$/.test(memberId),
      ),
    );
    assert.equal(new Set(generatedMemberIds).size, acceptedIds.length);
    assert.ok(
      acceptedIds.every(
        (id) => releasedById.get(id)?.status === "approved",
      ),
    );
    assert.equal(releasedById.get(applicationIds[1])?.status, "rejected");
    assert.equal(releasedById.get(applicationIds[1])?.memberId, null);
    assert.ok(released.every((row) => row.resultsReleasedAt instanceof Date));
    assert.ok(released.every((row) => row.resultsReleasedBy === hrUserId));

    const resultNotifications = await db
      .select({
        id: emailNotifications.id,
        applicationId: emailNotifications.applicationId,
        messageType: emailNotifications.messageType,
        recipient: emailNotifications.recipient,
        status: emailNotifications.status,
      })
      .from(emailNotifications)
      .where(
        inArray(emailNotifications.applicationId, applicationIds.slice(0, 5)),
      );
    assert.equal(resultNotifications.length, 5);
    assert.ok(resultNotifications.every((row) => row.status === "failed"));
    assert.deepEqual(
      new Map(
        resultNotifications.map((row) => [row.applicationId, row.messageType]),
      ),
      new Map([
        [applicationIds[0], "result_accepted"],
        [applicationIds[1], "result_rejected"],
        [applicationIds[2], "result_accepted"],
        [applicationIds[3], "result_accepted"],
        [applicationIds[4], "result_accepted"],
      ]),
    );

    const repeat = await releaseRequest();
    assert.equal(repeat.status, 200);
    assert.deepEqual(await repeat.json(), {
      released: 0,
      accepted: 0,
      rejected: 0,
      memberIdsGenerated: 0,
      releasedAt: null,
      emailDelivery: {
        queued: 0,
        sent: 0,
        failed: 0,
      },
    });

    const afterRepeat = await db
      .select({ id: applications.id, memberId: applications.memberId })
      .from(applications)
      .where(inArray(applications.id, acceptedIds));
    assert.deepEqual(
      new Map(afterRepeat.map((row) => [row.id, row.memberId])),
      new Map(
        acceptedIds.map((id) => [id, releasedById.get(id)?.memberId ?? null]),
      ),
    );

    assert.equal(
      (
        await db
          .select({ id: emailNotifications.id })
          .from(emailNotifications)
          .where(
            inArray(
              emailNotifications.applicationId,
              applicationIds.slice(0, 5),
            ),
          )
      ).length,
      5,
    );
  });

  await t.test("retries only failed result emails", async () => {
    const [sentNotification] = await db
      .select({ id: emailNotifications.id })
      .from(emailNotifications)
      .where(eq(emailNotifications.messageType, "result_accepted"))
      .limit(1);
    await db
      .update(emailNotifications)
      .set({
        status: "sent",
        providerMessageId: "already-sent",
        sentAt: new Date(),
      })
      .where(eq(emailNotifications.id, sentNotification.id));
    const [nonResultNotification] = await db
      .insert(emailNotifications)
      .values({
        applicationId: applicationIds[0],
        messageType: "application_submitted",
        recipient: "non-result@example.com",
        status: "failed",
        lastError: "test failure",
      })
      .returning({ id: emailNotifications.id });

    const response = await retryFailedEmailsRequest();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      retried: 4,
      sent: 0,
      failed: 4,
    });

    const [stillSent] = await db
      .select({ status: emailNotifications.status })
      .from(emailNotifications)
      .where(eq(emailNotifications.id, sentNotification.id));
    const [stillNonResult] = await db
      .select({ status: emailNotifications.status })
      .from(emailNotifications)
      .where(eq(emailNotifications.id, nonResultNotification.id));
    assert.equal(stillSent.status, "sent");
    assert.equal(stillNonResult.status, "failed");
    assert.equal(
      (
        await db
          .select({ id: emailNotifications.id })
          .from(emailNotifications)
          .where(
            inArray(
              emailNotifications.applicationId,
              applicationIds.slice(0, 5),
            ),
          )
      ).length,
      6,
    );
  });
});
