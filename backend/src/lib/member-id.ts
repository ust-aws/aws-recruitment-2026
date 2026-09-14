import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { applications } from "../db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function highestMemberSequence(
  memberIds: (string | null)[],
  recruitmentYear: number,
): number {
  const pattern = new RegExp(`^AWS-${recruitmentYear}-(\\d{4})$`);
  return memberIds.reduce((highest, memberId) => {
    const match = memberId?.match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

function formatMemberId(recruitmentYear: number, sequence: number): string {
  if (sequence > 9999) {
    throw new Error(`Member ID capacity reached for ${recruitmentYear}.`);
  }
  return `AWS-${recruitmentYear}-${String(sequence).padStart(4, "0")}`;
}

export async function allocateMemberIds(
  transaction: DbTransaction,
  recruitmentYear: number,
  count: number,
): Promise<string[]> {
  if (count === 0) return [];

  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtext(${`aws-members-${recruitmentYear}`}))`,
  );
  const memberRows = await transaction
    .select({ memberId: applications.memberId })
    .from(applications)
    .where(eq(applications.recruitmentYear, recruitmentYear));
  const firstSequence =
    highestMemberSequence(
      memberRows.map((row) => row.memberId),
      recruitmentYear,
    ) + 1;

  return Array.from({ length: count }, (_, index) =>
    formatMemberId(recruitmentYear, firstSequence + index),
  );
}