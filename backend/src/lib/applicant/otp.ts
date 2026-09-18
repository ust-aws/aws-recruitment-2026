import { randomInt, randomUUID } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applicantOtpChallenges,
  applications,
} from "../../db/schema";
import {
  applicantOtpMatches,
  hashApplicantOtp,
  type ApplicantSession,
} from "../../applicant-auth";
import { sendApplicantOtp } from "../email/service";

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 60;
export const OTP_REQUEST_WINDOW_SECONDS = 60 * 60;
export const OTP_MAX_REQUESTS_PER_WINDOW = 5;

type ApplicantIdentity = ApplicantSession & {
  email: string;
  firstName: string;
  lastName: string;
};

async function findApplicantIdentity(
  applicationCode: string,
  email: string,
): Promise<ApplicantIdentity | null> {
  const [row] = await db
    .select({
      applicationId: applications.id,
      applicationCode: applications.applicationCode,
      email: applicants.email,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(
      and(
        eq(applications.applicationCode, applicationCode),
        sql`lower(${applicants.email}) = ${email.toLowerCase()}`,
      ),
    )
    .limit(1);
  return row ?? null;
}

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export type IssueApplicantOtpResult =
  | { status: "issued" }
  | { status: "unknown_identity" }
  | { status: "throttled"; reason: "cooldown" | "hourly" };

export async function issueApplicantOtp(
  applicationCode: string,
  email: string,
  now = new Date(),
): Promise<IssueApplicantOtpResult> {
  const identity = await findApplicantIdentity(applicationCode, email);
  if (!identity) return { status: "unknown_identity" };

  const windowStart = new Date(
    now.getTime() - OTP_REQUEST_WINDOW_SECONDS * 1000,
  );
  const recent = await db
    .select({ createdAt: applicantOtpChallenges.createdAt })
    .from(applicantOtpChallenges)
    .where(
      and(
        eq(applicantOtpChallenges.applicationId, identity.applicationId),
        gte(applicantOtpChallenges.createdAt, windowStart),
      ),
    )
    .orderBy(desc(applicantOtpChallenges.createdAt))
    .limit(OTP_MAX_REQUESTS_PER_WINDOW);

  const cooldownStart = new Date(now.getTime() - OTP_RESEND_SECONDS * 1000);
  if (recent.length >= OTP_MAX_REQUESTS_PER_WINDOW) {
    return { status: "throttled", reason: "hourly" };
  }
  if (recent[0] && recent[0].createdAt > cooldownStart) {
    return { status: "throttled", reason: "cooldown" };
  }

  await db
    .update(applicantOtpChallenges)
    .set({ consumedAt: now })
    .where(
      and(
        eq(applicantOtpChallenges.applicationId, identity.applicationId),
        isNull(applicantOtpChallenges.consumedAt),
      ),
    );

  const challengeId = randomUUID();
  const code = generateOtp();
  await db.insert(applicantOtpChallenges).values({
    id: challengeId,
    applicationId: identity.applicationId,
    codeHash: hashApplicantOtp(challengeId, code),
    expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    createdAt: now,
  });

  try {
    await sendApplicantOtp({
      applicationId: identity.applicationId,
      applicationCode: identity.applicationCode,
      lastName: identity.lastName,
      email: identity.email,
      code,
      expiresInMinutes: OTP_TTL_SECONDS / 60,
    });
  } catch (err) {
    console.error("applicant OTP email failed", err);
  }
  return { status: "issued" };
}

export async function verifyApplicantOtp(
  applicationCode: string,
  email: string,
  code: string,
  now = new Date(),
): Promise<ApplicantSession | null> {
  const identity = await findApplicantIdentity(applicationCode, email);
  if (!identity) return null;

  const challenges = await db
    .select()
    .from(applicantOtpChallenges)
    .where(
      and(
        eq(applicantOtpChallenges.applicationId, identity.applicationId),
        isNull(applicantOtpChallenges.consumedAt),
        gt(applicantOtpChallenges.expiresAt, now),
        lt(applicantOtpChallenges.attempts, OTP_MAX_ATTEMPTS),
      ),
    )
    .orderBy(desc(applicantOtpChallenges.createdAt));

  if (challenges.length === 0) {
    return null;
  }

  const matched = challenges.find((challenge) =>
    applicantOtpMatches(challenge.id, code, challenge.codeHash),
  );

  if (!matched) {
    const [latest] = challenges;
    await db
      .update(applicantOtpChallenges)
      .set({ attempts: sql`${applicantOtpChallenges.attempts} + 1` })
      .where(
        and(
          eq(applicantOtpChallenges.id, latest.id),
          isNull(applicantOtpChallenges.consumedAt),
          lt(applicantOtpChallenges.attempts, OTP_MAX_ATTEMPTS),
        ),
      );
    return null;
  }

  const [consumed] = await db
    .update(applicantOtpChallenges)
    .set({ consumedAt: now })
    .where(
      and(
        eq(applicantOtpChallenges.id, matched.id),
        isNull(applicantOtpChallenges.consumedAt),
        lt(applicantOtpChallenges.attempts, OTP_MAX_ATTEMPTS),
        gt(applicantOtpChallenges.expiresAt, now),
      ),
    )
    .returning({ id: applicantOtpChallenges.id });

  if (!consumed) return null;
  return {
    applicationId: identity.applicationId,
    applicationCode: identity.applicationCode,
  };
}
