import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  applicants,
  applications,
  committees,
  membershipPaymentCampaigns,
  membershipPayments,
  positions,
} from "./db/schema";
import { listDirectoryMembers } from "./lib/membership/member-directory";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for member directory tests.");
const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Member directory tests require a test database.");
}

process.env.RECRUITMENT_YEAR = "2098";

const runId = randomUUID().slice(0, 8);
const campaignId = randomUUID();
const officeId = randomUUID();
const committeeId = randomUUID();
const officePositionId = randomUUID();
const staffPositionId = randomUUID();
const applicantIds = Array.from({ length: 5 }, () => randomUUID());

after(async () => {
  try {
    await db.delete(applicants).where(inArray(applicants.id, applicantIds));
    await db.delete(membershipPaymentCampaigns).where(eq(membershipPaymentCampaigns.id, campaignId));
    await db.delete(committees).where(inArray(committees.id, [officeId, committeeId]));
  } finally {
    await db.$client.end();
  }
});

test("member directory", async () => {
  await db.insert(committees).values([
    { id: officeId, name: `Office of the Test Officer ${runId}` },
    { id: committeeId, name: `Test Committee ${runId}` },
  ]);
  await db.insert(positions).values([
    { id: officePositionId, committeeId: officeId, name: "Executive Assistant to the Test Officer" },
    { id: staffPositionId, committeeId, name: "Test Committee Staff" },
  ]);
  await db.insert(membershipPaymentCampaigns).values({
    id: campaignId,
    recruitmentYear: 2098,
    opensAt: new Date("2098-10-01T00:00:00.000Z"),
    deadlineAt: new Date("2098-12-01T00:00:00.000Z"),
  });
  await db.insert(applicants).values(
    applicantIds.map((id, index) => ({
      id,
      firstName: `Dir${index}`,
      lastName: runId,
      email: `dir-${index}-${id}@ust.edu.ph`,
      birthday: "2005-06-15",
      gender: "female" as const,
      section: "3CSC",
      facebookUrl: `https://facebook.com/dir-${index}-${runId}`,
    })),
  );

  const specs = [
    { memberId: "AWS-9899-0010", type: "position" as const, status: "approved" as const, positionId: officePositionId },
    { memberId: "AWS-9899-0030", type: "position" as const, status: "approved" as const, positionId: staffPositionId },
    { memberId: "AWS-9899-0050", type: "member" as const, status: "approved" as const, positionId: null },
    // Not verified yet: must not appear.
    { memberId: "AWS-9899-0060", type: "member" as const, status: "approved" as const, positionId: null, unverified: true },
    // Archived: must not appear.
    { memberId: "AWS-9899-0070", type: "member" as const, status: "approved" as const, positionId: null, archived: true },
  ];
  for (const [index, spec] of specs.entries()) {
    const applicationId = randomUUID();
    await db.insert(applications).values({
      id: applicationId,
      applicantId: applicantIds[index],
      applicationCode: `AP-2098-${String(900001 + index)}`,
      recruitmentYear: 2098,
      motivation: "Directory test",
      applicationType: spec.type,
      status: spec.status,
      memberId: spec.memberId,
      finalPositionId: spec.positionId,
      archivedAt: spec.archived ? new Date() : null,
    });
    await db.insert(membershipPayments).values({
      campaignId,
      applicationId,
      status: spec.unverified ? "pending_verification" : "verified",
      membershipStatus: spec.unverified ? "inactive" : "active",
      verifiedAt: spec.unverified ? null : new Date("2098-10-06T00:00:00.000Z"),
    });
  }

  const members = (await listDirectoryMembers()).filter((member) => member.fullName.endsWith(runId));
  assert.deepEqual(
    members.map((member) => [member.memberId, member.role, member.position]),
    [
      ["AWS-9899-0010", "ea", `Executive Assistant to the Test Officer ${runId}`],
      ["AWS-9899-0030", "staff", "Test Committee Staff"],
      ["AWS-9899-0050", "general", "General Member"],
    ],
  );
  assert.deepEqual(
    [members[0].birthday, members[0].gender, members[0].section, members[0].facebookUrl],
    ["2005-06-15", "female", "3CSC", `https://facebook.com/dir-0-${runId}`],
  );
});
