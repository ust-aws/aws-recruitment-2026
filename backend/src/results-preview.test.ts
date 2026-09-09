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

  hrToken = (await signToken("results-hr@aws-ust.org")).token;

  await t.test("requires HR authentication", async () => {
    assert.equal((await app.request("/results/preview")).status, 401);
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
});
