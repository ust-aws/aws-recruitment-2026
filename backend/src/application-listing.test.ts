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
  throw new Error("DATABASE_URL is required for application listing tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Application listing tests require a test database.");
}

process.env.JWT_SECRET = "application-listing-secret-at-least-32-characters";

const reviewerId = randomUUID();
const reviewerEmail = `listing-${reviewerId}@aws-ust.org`;
const committeeIds = [randomUUID(), randomUUID()];
const positionIds = [randomUUID(), randomUUID()];
const applicantIds = [randomUUID(), randomUUID(), randomUUID()];
const applicationIds = [randomUUID(), randomUUID(), randomUUID()];
const suffix = randomUUID().slice(0, 8);
const applicationCodeBase = randomInt(900_000);
const committeeName = `Listing Committee ${suffix}`;
const otherCommitteeName = `Other Committee ${suffix}`;
const section = "9PGT";
let token = "";

after(async () => {
  try {
    await db.delete(applicants).where(inArray(applicants.id, applicantIds));
    await db.delete(committees).where(inArray(committees.id, committeeIds));
    await db.delete(users).where(eq(users.id, reviewerId));
  } finally {
    await db.$client.end();
  }
});

function applicationCode(index: number) {
  return `AP-2094-${String(applicationCodeBase + index).padStart(6, "0")}`;
}

async function list(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return app.request(`/applications?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function payload(response: Response) {
  return (await response.json()) as {
    applications: { id: string }[];
    total: number;
  };
}

test("HR application listing filters and paginates on the server", async (t) => {
  await db.insert(users).values({
    id: reviewerId,
    email: reviewerEmail,
    passwordHash: "test-only",
    firstName: "Listing",
    lastName: "Reviewer",
    role: "hr",
  });
  await db.insert(committees).values([
    { id: committeeIds[0], name: committeeName },
    { id: committeeIds[1], name: otherCommitteeName },
  ]);
  await db.insert(positions).values([
    {
      id: positionIds[0],
      committeeId: committeeIds[0],
      name: `Listing Position ${suffix}`,
    },
    {
      id: positionIds[1],
      committeeId: committeeIds[1],
      name: `Other Position ${suffix}`,
    },
  ]);
  await db.insert(applicants).values([
    {
      id: applicantIds[0],
      firstName: "PageAlpha",
      lastName: `Applicant${suffix}`,
      email: `page-alpha-${suffix}@ust.edu.ph`,
      section,
    },
    {
      id: applicantIds[1],
      firstName: "PageBeta",
      lastName: `Applicant${suffix}`,
      email: `page-beta-${suffix}@ust.edu.ph`,
      section,
    },
    {
      id: applicantIds[2],
      firstName: "PageGamma",
      lastName: `Applicant${suffix}`,
      email: `page-gamma-${suffix}@ust.edu.ph`,
      section,
    },
  ]);
  await db.insert(applications).values([
    {
      id: applicationIds[0],
      applicantId: applicantIds[0],
      applicationCode: applicationCode(0),
      recruitmentYear: 2094,
      status: "pending",
      submittedAt: new Date("2094-01-03T00:00:00.000Z"),
    },
    {
      id: applicationIds[1],
      applicantId: applicantIds[1],
      applicationCode: applicationCode(1),
      recruitmentYear: 2094,
      status: "approved",
      submittedAt: new Date("2094-01-02T00:00:00.000Z"),
    },
    {
      id: applicationIds[2],
      applicantId: applicantIds[2],
      applicationCode: applicationCode(2),
      recruitmentYear: 2094,
      status: "rejected",
      archivedAt: new Date("2094-01-04T00:00:00.000Z"),
      submittedAt: new Date("2094-01-01T00:00:00.000Z"),
    },
  ]);
  await db.insert(applicationChoices).values([
    {
      applicationId: applicationIds[0],
      positionId: positionIds[0],
      preferenceRank: 1,
    },
    {
      applicationId: applicationIds[1],
      positionId: positionIds[0],
      preferenceRank: 1,
    },
    {
      applicationId: applicationIds[2],
      positionId: positionIds[1],
      preferenceRank: 1,
    },
  ]);
  token = (await signToken(reviewerEmail)).token;

  await t.test("rejects invalid pagination and status parameters", async () => {
    assert.equal((await list({ page: "0" })).status, 400);
    assert.equal((await list({ page: "1.5" })).status, 400);
    assert.equal((await list({ pageSize: "101" })).status, 400);
    assert.equal((await list({ status: "reviewing" })).status, 400);
  });

  await t.test("returns bounded pages with the full filtered total", async () => {
    const firstResponse = await list({
      archive: "all",
      section,
      page: "1",
      pageSize: "1",
    });
    const secondResponse = await list({
      archive: "all",
      section,
      page: "2",
      pageSize: "1",
    });
    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);

    const first = await payload(firstResponse);
    const second = await payload(secondResponse);
    assert.equal(first.total, 3);
    assert.equal(first.applications.length, 1);
    assert.equal(second.total, 3);
    assert.equal(second.applications.length, 1);
    assert.notEqual(first.applications[0]?.id, second.applications[0]?.id);
  });

  await t.test("filters by name, committee, status, and archive", async () => {
    const byName = await payload(
      await list({
        archive: "all",
        section,
        query: `PageAlpha Applicant${suffix}`,
      }),
    );
    assert.equal(byName.total, 1);
    assert.equal(byName.applications[0]?.id, applicationIds[0]);

    const byCommittee = await payload(
      await list({ archive: "all", section, committeeName }),
    );
    assert.equal(byCommittee.total, 2);

    const byStatus = await payload(
      await list({ archive: "all", section, status: "approved" }),
    );
    assert.equal(byStatus.total, 1);
    assert.equal(byStatus.applications[0]?.id, applicationIds[1]);

    const archived = await payload(await list({ archive: "archived", section }));
    assert.equal(archived.total, 1);
    assert.equal(archived.applications[0]?.id, applicationIds[2]);
  });
});
