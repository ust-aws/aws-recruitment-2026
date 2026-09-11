import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { app } from "./app";
import { signToken } from "./auth";
import { db } from "./db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  positions,
  users,
} from "./db/schema";
import { getApplicantEditableApplication } from "./lib/applicant-editing";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for application decision tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Application decision tests require a test database.");
}

process.env.JWT_SECRET = "application-decisions-secret-at-least-32-characters";

const reviewerId = randomUUID();
const reviewerEmail = `decisions-${reviewerId}@aws-ust.org`;
const committeeIds = [randomUUID(), randomUUID()];
const positionIds = [randomUUID(), randomUUID()];
const applicantId = randomUUID();
const applicationId = randomUUID();
let token = "";

after(async () => {
  try {
    await db.delete(applicants).where(eq(applicants.id, applicantId));
    await db.delete(committees).where(inArray(committees.id, committeeIds));
    await db.delete(users).where(eq(users.id, reviewerId));
  } finally {
    await db.$client.end();
  }
});

function decisionRequest(
  body: Record<string, unknown>,
  id = applicationId,
  authenticated = true,
) {
  return app.request(`/applications/${id}/decisions`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test("HR committee decisions", async (t) => {
  await db.insert(users).values({
    id: reviewerId,
    email: reviewerEmail,
    passwordHash: "test-only",
    firstName: "Review",
    lastName: "Owner",
    role: "hr",
  });
  await db.insert(committees).values([
    { id: committeeIds[0], name: `Decision A ${applicationId}` },
    { id: committeeIds[1], name: `Decision B ${applicationId}` },
  ]);
  await db.insert(positions).values([
    {
      id: positionIds[0],
      committeeId: committeeIds[0],
      name: "Decision Position A",
    },
    {
      id: positionIds[1],
      committeeId: committeeIds[1],
      name: "Decision Position B",
    },
  ]);
  await db.insert(applicants).values({
    id: applicantId,
    firstName: "Decision",
    lastName: "Applicant",
    email: `decision-${applicationId}@ust.edu.ph`,
  });
  await db.insert(applications).values({
    id: applicationId,
    applicantId,
    applicationCode: "AP-2094-700001",
    recruitmentYear: 2094,
  });
  await db.insert(applicationChoices).values([
    {
      applicationId,
      positionId: positionIds[0],
      preferenceRank: 1,
    },
    {
      applicationId,
      positionId: positionIds[1],
      preferenceRank: 2,
    },
  ]);
  token = (await signToken(reviewerEmail)).token;

  await t.test("requires HR authentication and valid input", async () => {
    assert.equal(
      (
        await decisionRequest(
          { positionId: positionIds[0], decisionStatus: "approved" },
          applicationId,
          false,
        )
      ).status,
      401,
    );
    assert.equal((await decisionRequest({ positionId: positionIds[0] })).status, 400);
    assert.equal((await decisionRequest({})).status, 400);
  });

  await t.test("returns pending choice decisions to HR", async () => {
    const response = await app.request(`/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      status: string;
      finalPlacement: unknown;
      choices: { decisionStatus: string }[];
    };
    assert.equal(payload.status, "pending");
    assert.equal(payload.finalPlacement, null);
    assert.deepEqual(
      payload.choices.map((choice) => choice.decisionStatus),
      ["pending", "pending"],
    );
  });

  await t.test("locks applicant editing when the first decision is saved", async () => {
    const response = await decisionRequest({
      positionId: positionIds[0],
      decisionStatus: "approved",
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      status: string;
      choices: { positionId: string; decisionStatus: string }[];
    };
    assert.equal(payload.status, "pending");
    assert.equal(
      payload.choices.find((choice) => choice.positionId === positionIds[0])
        ?.decisionStatus,
      "approved",
    );

    const editable = await getApplicantEditableApplication(applicationId);
    assert.equal(editable?.canEdit, false);
    assert.match(editable?.lockReason ?? "", /HR review has started/i);

    const [choiceAudit] = await db
      .select({
        decidedBy: applicationChoices.decidedBy,
        decidedAt: applicationChoices.decidedAt,
      })
      .from(applicationChoices)
      .where(eq(applicationChoices.positionId, positionIds[0]));
    const [applicationAudit] = await db
      .select({
        reviewedBy: applications.reviewedBy,
        reviewedAt: applications.reviewedAt,
      })
      .from(applications)
      .where(eq(applications.id, applicationId));
    assert.equal(choiceAudit.decidedBy, reviewerId);
    assert.ok(choiceAudit.decidedAt instanceof Date);
    assert.equal(applicationAudit.reviewedBy, reviewerId);
    assert.ok(applicationAudit.reviewedAt instanceof Date);
  });

  await t.test("requires an approved choice for final placement", async () => {
    const response = await decisionRequest({
      finalPositionId: positionIds[1],
    });
    assert.equal(response.status, 409);
    assert.match(
      ((await response.json()) as { error: string }).error,
      /approved choices/i,
    );
  });

  await t.test("derives pending until final placement is selected", async () => {
    const decision = await decisionRequest({
      positionId: positionIds[1],
      decisionStatus: "rejected",
    });
    assert.equal(decision.status, 200);
    assert.equal(
      ((await decision.json()) as { status: string }).status,
      "pending",
    );

    const placement = await decisionRequest({
      finalPositionId: positionIds[0],
    });
    assert.equal(placement.status, 200);
    const payload = (await placement.json()) as {
      status: string;
      finalPlacement: { positionId: string };
    };
    assert.equal(payload.status, "approved");
    assert.equal(payload.finalPlacement.positionId, positionIds[0]);
  });

  await t.test("derives rejection and clears stale placement", async () => {
    const response = await decisionRequest({
      positionId: positionIds[0],
      decisionStatus: "rejected",
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      status: string;
      finalPlacement: unknown;
    };
    assert.equal(payload.status, "rejected");
    assert.equal(payload.finalPlacement, null);
  });

  await t.test("rejects unknown and released applications", async () => {
    assert.equal(
      (
        await decisionRequest(
          { positionId: positionIds[0], decisionStatus: "approved" },
          randomUUID(),
        )
      ).status,
      404,
    );
    await db
      .update(applications)
      .set({ resultsReleasedAt: new Date() })
      .where(eq(applications.id, applicationId));
    assert.equal(
      (
        await decisionRequest({
          positionId: positionIds[0],
          decisionStatus: "approved",
        })
      ).status,
      409,
    );
  });
});
