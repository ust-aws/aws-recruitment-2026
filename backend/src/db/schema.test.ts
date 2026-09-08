import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  applicants,
  applicantOtpChallenges,
  applicationChoices,
  applications,
  committees,
  positions,
  users,
} from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database constraint tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Database constraint tests require a test database.");
}

const client = postgres(databaseUrl, { prepare: false, max: 1 });
const db = drizzle(client);

after(async () => {
  await client.end();
});

test("application foundation database constraints", async (t) => {
  const runId = randomUUID();
  const reviewerId = randomUUID();
  const committeeId = randomUUID();
  const positionId = randomUUID();
  const applicantIds: string[] = [];

  t.after(async () => {
    if (applicantIds.length > 0) {
      await db
        .delete(applicants)
        .where(inArray(applicants.id, applicantIds));
    }
    await db.delete(committees).where(eq(committees.id, committeeId));
    await db.delete(users).where(eq(users.id, reviewerId));
  });

  await db.insert(users).values({
    id: reviewerId,
    email: `schema-test-${runId}@example.com`,
    passwordHash: "test-only",
    firstName: "Schema",
    lastName: "Reviewer",
    role: "hr",
  });

  await db.insert(committees).values({
    id: committeeId,
    name: `Schema Test ${runId}`,
  });

  await db.insert(positions).values({
    id: positionId,
    committeeId,
    name: "Schema Test Position",
  });

  async function createApplicant() {
    const id = randomUUID();
    applicantIds.push(id);
    await db.insert(applicants).values({
      id,
      firstName: "Schema",
      lastName: "Applicant",
      email: `${id}@example.com`,
      age: 20,
      section: "TEST-1",
    });
    return id;
  }

  async function createApplication(
    values: Partial<typeof applications.$inferInsert> = {},
  ) {
    const id = randomUUID();
    const applicantId = values.applicantId ?? (await createApplicant());
    await db.insert(applications).values({
      id,
      applicantId,
      motivation: "Database constraint test",
      ...values,
    });
    return { id, applicantId };
  }

  await t.test("generates unique application codes with the current year", async () => {
    const first = await createApplication();
    const second = await createApplication();
    const rows = await db
      .select({
        applicationCode: applications.applicationCode,
        recruitmentYear: applications.recruitmentYear,
      })
      .from(applications)
      .where(inArray(applications.id, [first.id, second.id]));

    assert.equal(rows.length, 2);
    assert.notEqual(rows[0].applicationCode, rows[1].applicationCode);
    for (const row of rows) {
      assert.match(row.applicationCode, /^AP-[0-9]{4}-[0-9]{6}$/);
      assert.equal(
        row.applicationCode.slice(3, 7),
        String(row.recruitmentYear),
      );
    }
  });

  await t.test("rejects duplicate application codes", async () => {
    const applicationCode = "AP-2026-100001";
    await createApplication({ applicationCode, recruitmentYear: 2026 });

    await assert.rejects(async () => {
      await createApplication({ applicationCode, recruitmentYear: 2026 });
    });
  });

  await t.test("allows only one application per recruitment year", async () => {
    const applicantId = await createApplicant();
    await createApplication({
      applicantId,
      applicationCode: "AP-2026-200001",
      recruitmentYear: 2026,
    });

    await assert.rejects(async () => {
      await createApplication({
        applicantId,
        applicationCode: "AP-2026-200002",
        recruitmentYear: 2026,
      });
    });

    await createApplication({
      applicantId,
      applicationCode: "AP-2027-200003",
      recruitmentYear: 2027,
    });
  });

  await t.test("rejects invalid or mismatched recruitment years", async () => {
    await assert.rejects(async () => {
      await createApplication({
        applicationCode: "AP-1999-300001",
        recruitmentYear: 1999,
      });
    });

    await assert.rejects(async () => {
      await createApplication({
        applicationCode: "AP-2027-300002",
        recruitmentYear: 2026,
      });
    });
  });

  await t.test("keeps member IDs unique and non-blank", async () => {
    await createApplication({ memberId: "AWS-2026-0001" });

    await assert.rejects(async () => {
      await createApplication({ memberId: "AWS-2026-0001" });
    });

    await assert.rejects(async () => {
      await createApplication({ memberId: "   " });
    });
  });

  await t.test("requires decision timestamps for reviewed choices", async () => {
    const approvedApplication = await createApplication();
    await assert.rejects(async () => {
      await db.insert(applicationChoices).values({
        applicationId: approvedApplication.id,
        positionId,
        preferenceRank: 1,
        decisionStatus: "approved",
        decidedBy: reviewerId,
      });
    });

    const pendingApplication = await createApplication();
    await assert.rejects(async () => {
      await db.insert(applicationChoices).values({
        applicationId: pendingApplication.id,
        positionId,
        preferenceRank: 1,
        decisionStatus: "pending",
        decidedAt: new Date(),
      });
    });

    const validApplication = await createApplication();
    await db.insert(applicationChoices).values({
      applicationId: validApplication.id,
      positionId,
      preferenceRank: 1,
      decisionStatus: "approved",
      decidedBy: reviewerId,
      decidedAt: new Date(),
    });
  });

  await t.test("requires valid placement and audit metadata", async () => {
    await assert.rejects(async () => {
      await createApplication({ finalPositionId: randomUUID() });
    });

    await assert.rejects(async () => {
      await createApplication({ resultsReleasedBy: reviewerId });
    });

    await assert.rejects(async () => {
      await createApplication({ archivedBy: reviewerId });
    });

    await assert.rejects(async () => {
      await createApplication({ archiveReason: "Duplicate application" });
    });

    await createApplication({
      finalPositionId: positionId,
      resultsReleasedAt: new Date(),
      resultsReleasedBy: reviewerId,
      memberId: "AWS-2026-0002",
      archivedAt: new Date(),
      archivedBy: reviewerId,
      archiveReason: "Database test record",
    });
  });

  await t.test("enforces OTP challenge security constraints", async () => {
    const application = await createApplication();
    const createdAt = new Date("2099-01-01T00:00:00.000Z");

    await db.insert(applicantOtpChallenges).values({
      applicationId: application.id,
      codeHash: "a".repeat(64),
      expiresAt: new Date("2099-01-01T00:10:00.000Z"),
      createdAt,
    });

    await assert.rejects(async () => {
      await db.insert(applicantOtpChallenges).values({
        applicationId: application.id,
        codeHash: "not-a-valid-hash",
        expiresAt: new Date("2099-01-01T00:10:00.000Z"),
        createdAt,
      });
    });

    await assert.rejects(async () => {
      await db.insert(applicantOtpChallenges).values({
        applicationId: application.id,
        codeHash: "b".repeat(64),
        attempts: 6,
        expiresAt: new Date("2099-01-01T00:10:00.000Z"),
        createdAt,
      });
    });

    await assert.rejects(async () => {
      await db.insert(applicantOtpChallenges).values({
        applicationId: application.id,
        codeHash: "c".repeat(64),
        expiresAt: new Date("2098-12-31T23:59:59.000Z"),
        createdAt,
      });
    });
  });
});
