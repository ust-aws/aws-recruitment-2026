import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { and, eq } from "drizzle-orm";
import { app } from "./app";
import { hashApplicantOtp } from "./applicant-auth";
import { db } from "./db";
import {
  applicants,
  applicantOtpChallenges,
  applications,
  emailNotifications,
} from "./db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for applicant auth tests.");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
if (!/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Applicant auth tests require a test database.");
}

process.env.APPLICANT_AUTH_SECRET =
  "applicant-auth-test-secret-at-least-32-characters";
process.env.EMAIL_ENABLED = "false";

const applicantId = randomUUID();
const applicationId = randomUUID();
const applicationCode = "AP-2098-400001";
const email = `otp-${randomUUID()}@ust.edu.ph`;

after(async () => {
  try {
    await db.delete(applicants).where(eq(applicants.id, applicantId));
  } finally {
    await db.$client.end();
  }
});

async function postJson(path: string, body: Record<string, unknown>) {
  return app.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function clearChallenges() {
  await db
    .delete(applicantOtpChallenges)
    .where(eq(applicantOtpChallenges.applicationId, applicationId));
}

async function insertChallenge(input: {
  code: string;
  createdAt?: Date;
  expiresAt?: Date;
}) {
  const id = randomUUID();
  const createdAt = input.createdAt ?? new Date();
  await db.insert(applicantOtpChallenges).values({
    id,
    applicationId,
    codeHash: hashApplicantOtp(id, input.code),
    createdAt,
    expiresAt:
      input.expiresAt ?? new Date(createdAt.getTime() + 10 * 60 * 1000),
  });
  return id;
}

test("applicant OTP verification", async (t) => {
  await db.insert(applicants).values({
    id: applicantId,
    firstName: "OTP",
    lastName: "Applicant",
    email,
    age: 20,
    birthday: "2005-06-15",
    gender: "male",
    section: "TEST-1",
  });
  await db.insert(applications).values({
    id: applicationId,
    applicantId,
    applicationCode,
    recruitmentYear: 2098,
    motivation: "Applicant auth integration test",
  });

  await t.test("validates request and verification bodies", async () => {
    const badRequest = await postJson("/applicant-auth/request-code", {
      applicationCode: "wrong",
      email,
    });
    assert.equal(badRequest.status, 400);

    const badCode = await postJson("/applicant-auth/verify-code", {
      applicationCode,
      email,
      code: "12",
    });
    assert.equal(badCode.status, 400);
  });

  await t.test("uses the same generic response for matched and unknown details", async () => {
    await clearChallenges();
    const matched = await postJson("/applicant-auth/request-code", {
      applicationCode,
      email,
    });
    const unknown = await postJson("/applicant-auth/request-code", {
      applicationCode: "AP-2098-999999",
      email: "unknown@ust.edu.ph",
    });

    assert.equal(matched.status, 202);
    assert.equal(unknown.status, 202);
    assert.deepEqual(await matched.json(), await unknown.json());

    const notifications = await db
      .select({
        messageType: emailNotifications.messageType,
        recipient: emailNotifications.recipient,
      })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.applicationId, applicationId),
          eq(emailNotifications.messageType, "applicant_otp"),
        ),
      );
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].recipient, email);
  });

  await t.test("throttles repeated code requests", async () => {
    await clearChallenges();
    const first = await postJson("/applicant-auth/request-code", {
      applicationCode,
      email,
    });
    const second = await postJson("/applicant-auth/request-code", {
      applicationCode,
      email,
    });
    assert.equal(first.status, 202);
    assert.equal(second.status, 429);

    const rows = await db
      .select({ id: applicantOtpChallenges.id })
      .from(applicantOtpChallenges)
      .where(eq(applicantOtpChallenges.applicationId, applicationId));
    assert.equal(rows.length, 1);
  });

  await t.test("limits an application to five requests per hour", async () => {
    await clearChallenges();
    const now = Date.now();
    for (let index = 0; index < 5; index++) {
      await insertChallenge({
        code: String(100000 + index),
        createdAt: new Date(now - (index + 2) * 60 * 1000),
      });
    }

    const limited = await postJson("/applicant-auth/request-code", {
      applicationCode,
      email,
    });
    assert.equal(limited.status, 429);

    const rows = await db
      .select({ id: applicantOtpChallenges.id })
      .from(applicantOtpChallenges)
      .where(eq(applicantOtpChallenges.applicationId, applicationId));
    assert.equal(rows.length, 5);
  });

  await t.test("creates a one-time applicant session cookie", async () => {
    await clearChallenges();
    const code = "123456";
    await insertChallenge({ code });

    const verified = await postJson("/applicant-auth/verify-code", {
      applicationCode,
      email: email.toUpperCase(),
      code,
    });
    assert.equal(verified.status, 200);
    const cookieHeader = verified.headers.get("set-cookie") ?? "";
    assert.match(cookieHeader, /^applicant_token=/);
    assert.match(cookieHeader, /HttpOnly/i);
    assert.match(cookieHeader, /SameSite=Lax/i);
    const cookie = cookieHeader.split(";", 1)[0];

    const session = await app.request("/applicant-auth/me", {
      headers: { Cookie: cookie },
    });
    assert.equal(session.status, 200);
    assert.deepEqual(await session.json(), { applicationCode });

    const replay = await postJson("/applicant-auth/verify-code", {
      applicationCode,
      email,
      code,
    });
    assert.equal(replay.status, 401);
  });

  await t.test("locks a challenge after five incorrect attempts", async () => {
    await clearChallenges();
    const code = "654321";
    const challengeId = await insertChallenge({ code });

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await postJson("/applicant-auth/verify-code", {
        applicationCode,
        email,
        code: "000000",
      });
      assert.equal(response.status, 401);
    }

    const [challenge] = await db
      .select({ attempts: applicantOtpChallenges.attempts })
      .from(applicantOtpChallenges)
      .where(eq(applicantOtpChallenges.id, challengeId));
    assert.equal(challenge.attempts, 5);

    const locked = await postJson("/applicant-auth/verify-code", {
      applicationCode,
      email,
      code,
    });
    assert.equal(locked.status, 401);
  });

  await t.test("rejects expired codes", async () => {
    await clearChallenges();
    const now = new Date();
    await insertChallenge({
      code: "234567",
      createdAt: new Date(now.getTime() - 11 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 60 * 1000),
    });

    const expired = await postJson("/applicant-auth/verify-code", {
      applicationCode,
      email,
      code: "234567",
    });
    assert.equal(expired.status, 401);
  });

  await t.test("requires a valid session and clears it on logout", async () => {
    const missing = await app.request("/applicant-auth/me");
    assert.equal(missing.status, 401);

    const logout = await postJson("/applicant-auth/logout", {});
    assert.equal(logout.status, 204);
    assert.match(
      logout.headers.get("set-cookie") ?? "",
      /^applicant_token=;/,
    );
  });
});
