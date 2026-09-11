import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for application archive tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Application archive tests require a test database.");
}

process.env.JWT_SECRET = "application-archive-secret-at-least-32-characters";

const reviewerId = randomUUID();
const reviewerEmail = `archive-${reviewerId}@aws-ust.org`;
const committeeIds = [randomUUID(), randomUUID()];
const positionIds = [randomUUID(), randomUUID()];
const applicantId = randomUUID();
const applicationId = randomUUID();
const unknownApplicationId = randomUUID();
const applicationCode = `AP-2092-${String(randomInt(1_000_000)).padStart(6, "0")}`;
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

function archiveRequest(
  archived: boolean,
  id: string = applicationId,
  authenticated = true,
) {
  return app.request(`/applications/${id}/archive`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ archived }),
  });
}

async function listedIds(archive?: "active" | "archived" | "all") {
  const suffix = archive ? `?archive=${archive}` : "";
  const response = await app.request(`/applications${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    applications: { id: string }[];
  };
  return payload.applications.map((application) => application.id);
}

test("HR application archiving", async (t) => {
  await db.insert(users).values({
    id: reviewerId,
    email: reviewerEmail,
    passwordHash: "test-only",
    firstName: "Archive",
    lastName: "Reviewer",
    role: "hr",
  });
  await db.insert(committees).values([
    { id: committeeIds[0], name: `Archive A ${applicationId}` },
    { id: committeeIds[1], name: `Archive B ${applicationId}` },
  ]);
  await db.insert(positions).values([
    {
      id: positionIds[0],
      committeeId: committeeIds[0],
      name: "Archive Position A",
    },
    {
      id: positionIds[1],
      committeeId: committeeIds[1],
      name: "Archive Position B",
    },
  ]);
  await db.insert(applicants).values({
    id: applicantId,
    firstName: "Archive",
    lastName: "Applicant",
    email: `archive-${applicationId}@ust.edu.ph`,
  });
  await db.insert(applications).values({
    id: applicationId,
    applicantId,
    applicationCode,
    recruitmentYear: 2092,
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

  await t.test("requires authentication and validates input", async () => {
    assert.equal((await archiveRequest(true, applicationId, false)).status, 401);
    assert.equal((await archiveRequest(true, "not-a-uuid")).status, 400);
    assert.equal(
      (
        await app.request(`/applications/${applicationId}/archive`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        })
      ).status,
      400,
    );
    assert.equal((await archiveRequest(true, unknownApplicationId)).status, 404);
    assert.equal(
      (
        await app.request("/applications?archive=deleted", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).status,
      400,
    );
  });

  await t.test("archives without deleting and records the reviewer", async () => {
    assert.ok((await listedIds()).includes(applicationId));

    const response = await archiveRequest(true);
    assert.equal(response.status, 200);
    const archived = (await response.json()) as {
      id: string;
      archivedAt: string | null;
    };
    assert.equal(archived.id, applicationId);
    assert.ok(archived.archivedAt);

    const [stored] = await db
      .select({
        archivedAt: applications.archivedAt,
        archivedBy: applications.archivedBy,
      })
      .from(applications)
      .where(eq(applications.id, applicationId));
    assert.ok(stored.archivedAt);
    assert.equal(stored.archivedBy, reviewerId);
    assert.ok(!(await listedIds()).includes(applicationId));
    assert.ok((await listedIds("archived")).includes(applicationId));
    assert.ok((await listedIds("all")).includes(applicationId));

    const detail = await app.request(`/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(detail.status, 200);
  });

  await t.test("restores the same application and clears archive audit", async () => {
    const response = await archiveRequest(false);
    assert.equal(response.status, 200);
    const restored = (await response.json()) as {
      id: string;
      archivedAt: string | null;
    };
    assert.equal(restored.id, applicationId);
    assert.equal(restored.archivedAt, null);

    const [stored] = await db
      .select({
        archivedAt: applications.archivedAt,
        archivedBy: applications.archivedBy,
        archiveReason: applications.archiveReason,
      })
      .from(applications)
      .where(eq(applications.id, applicationId));
    assert.equal(stored.archivedAt, null);
    assert.equal(stored.archivedBy, null);
    assert.equal(stored.archiveReason, null);
    assert.ok((await listedIds()).includes(applicationId));
  });
});
