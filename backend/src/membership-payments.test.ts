import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { app } from "./app";
import { signApplicantToken } from "./applicant-auth";
import { signToken } from "./auth";
import { db } from "./db";
import {
  applicants,
  applications,
  committees,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPayments,
  membershipPaymentSubmissions,
  positions,
  users,
} from "./db/schema";
import { prepareQueuedEmail, runEmailOutbox } from "./lib/email/queued-emails";
import { originHeaders } from "./test-support/request";

const databaseUrl = process.env.DATABASE_URL ?? "";
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.replace(/^\/+/, "")
  : "";
if (!databaseUrl || !/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Membership payment tests require a test database.");
}

process.env.JWT_SECRET = "membership-payment-test-secret";
process.env.APPLICANT_AUTH_SECRET = "membership-payment-applicant-secret-32chars";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.RECRUITMENT_YEAR = "2096";
process.env.EMAIL_ENABLED = "false";
process.env.S3_BUCKET ??= "aws-ust-recruitment-test";
process.env.S3_REGION ??= "us-east-1";
process.env.AWS_ACCESS_KEY_ID ??= "test";
process.env.AWS_SECRET_ACCESS_KEY ??= "test";

const ids = {
  admin: randomUUID(),
  finance: randomUUID(),
  hr: randomUUID(),
  committee: randomUUID(),
  position: randomUUID(),
  acceptedApplicant: randomUUID(),
  rejectedApplicant: randomUUID(),
  memberApplicant: randomUUID(),
  archivedApplicant: randomUUID(),
  acceptedApplication: randomUUID(),
  rejectedApplication: randomUUID(),
  memberApplication: randomUUID(),
  archivedApplication: randomUUID(),
};

let adminToken = "";
let financeToken = "";
let hrToken = "";
let applicantToken = "";

function staffRequest(path: string, token: string, init: RequestInit = {}) {
  return app.request(path, {
    ...init,
    headers: originHeaders({
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    }),
  });
}

after(async () => {
  try {
    await db
      .delete(membershipPaymentCampaigns)
      .where(eq(membershipPaymentCampaigns.recruitmentYear, 2096));
    await db
      .delete(applicants)
      .where(
        inArray(applicants.id, [
          ids.acceptedApplicant,
          ids.rejectedApplicant,
          ids.memberApplicant,
          ids.archivedApplicant,
        ]),
      );
    await db.delete(positions).where(eq(positions.id, ids.position));
    await db.delete(committees).where(eq(committees.id, ids.committee));
    await db
      .delete(users)
      .where(inArray(users.id, [ids.admin, ids.finance, ids.hr]));
  } finally {
    await db.$client.end();
  }
});

test("membership payment workflow", async (t) => {
  await db.insert(users).values([
    { id: ids.admin, email: `${ids.admin}@test.dev`, passwordHash: "x", firstName: "Admin", lastName: "User", role: "admin" },
    { id: ids.finance, email: `${ids.finance}@test.dev`, passwordHash: "x", firstName: "Finance", lastName: "User", role: "finance" },
    { id: ids.hr, email: `${ids.hr}@test.dev`, passwordHash: "x", firstName: "HR", lastName: "User", role: "hr" },
  ]);
  await db.insert(committees).values({ id: ids.committee, name: `Payment ${ids.committee}` });
  await db.insert(positions).values({ id: ids.position, committeeId: ids.committee, name: "Payment Staff" });
  await db.insert(applicants).values([
    { id: ids.acceptedApplicant, firstName: "Accepted", lastName: "Applicant", email: `accepted-${ids.acceptedApplicant}@ust.edu.ph`, birthday: "2005-06-15", gender: "female" as const, section: "3CSC", facebookUrl: "https://facebook.com/accepted.applicant" },
    { id: ids.rejectedApplicant, firstName: "Rejected", lastName: "Applicant", email: `rejected-${ids.rejectedApplicant}@ust.edu.ph` },
    { id: ids.memberApplicant, firstName: "Member", lastName: "Applicant", email: `member-${ids.memberApplicant}@ust.edu.ph` },
    { id: ids.archivedApplicant, firstName: "Archived", lastName: "Applicant", email: `archived-${ids.archivedApplicant}@ust.edu.ph` },
  ]);
  await db.insert(applications).values([
    { id: ids.acceptedApplication, applicantId: ids.acceptedApplicant, applicationCode: "AP-2096-810001", recruitmentYear: 2096, status: "approved", finalPositionId: ids.position, resultsReleasedAt: new Date() },
    { id: ids.rejectedApplication, applicantId: ids.rejectedApplicant, applicationCode: "AP-2096-810002", recruitmentYear: 2096, status: "rejected", resultsReleasedAt: new Date() },
    { id: ids.memberApplication, applicantId: ids.memberApplicant, applicationCode: "AP-2096-810003", recruitmentYear: 2096, status: "approved", applicationType: "member" },
    { id: ids.archivedApplication, applicantId: ids.archivedApplicant, applicationCode: "AP-2096-810004", recruitmentYear: 2096, status: "approved", finalPositionId: ids.position, resultsReleasedAt: new Date(), archivedAt: new Date() },
  ]);
  adminToken = (await signToken(`${ids.admin}@test.dev`)).token;
  financeToken = (await signToken(`${ids.finance}@test.dev`)).token;
  hrToken = (await signToken(`${ids.hr}@test.dev`)).token;
  applicantToken = (
    await signApplicantToken({
      applicationId: ids.acceptedApplication,
      applicationCode: "AP-2096-810001",
    })
  ).token;

  await t.test("HR manages the complete campaign while Finance is denied", async () => {
    assert.equal(
      (await staffRequest("/applications", financeToken)).status,
      401,
    );
    assert.equal(
      (await staffRequest("/membership-payments", financeToken)).status,
      401,
    );
    assert.equal(
      (await staffRequest("/membership-payments", adminToken)).status,
      200,
    );
    const schedule = JSON.stringify({
      opensAt: "2026-09-01T00:00:00.000Z",
      deadlineAt: "2096-12-01T00:00:00.000Z",
      generalChatLink: "https://m.me/j/general-test",
      committeeChatLinks: [
        { committeeId: ids.committee, chatLink: "https://m.me/j/committee-test" },
      ],
    });
    const details = JSON.stringify({
      amountCents: 25000,
      gcashAccountName: "AWS Builders - UST",
      gcashAccountNumber: "09171234567",
      bpiAccountName: null,
      bpiAccountNumber: null,
    });
    const withoutAccount = JSON.stringify({
      ...JSON.parse(details),
      gcashAccountName: null,
      gcashAccountNumber: null,
    });
    assert.equal((await staffRequest("/membership-payments/campaign/schedule", financeToken, { method: "PUT", body: schedule })).status, 401);
    assert.equal((await staffRequest("/membership-payments/campaign/schedule", hrToken, { method: "PUT", body: schedule })).status, 200);
    assert.equal((await staffRequest("/membership-payments/campaign/payment-details", hrToken, { method: "PUT", body: withoutAccount })).status, 400);
    assert.equal((await staffRequest("/membership-payments/campaign/payment-details", hrToken, { method: "PUT", body: details })).status, 200);
    const qrRequest = JSON.stringify({
      provider: "gcash",
      mimeType: "image/png",
      sizeBytes: 100,
      checksumSha256: "A".repeat(43) + "=",
    });
    assert.equal((await staffRequest("/membership-payments/campaign/payment-qr/presign", financeToken, { method: "POST", body: qrRequest })).status, 401);
    const qrUpload = await staffRequest(
      "/membership-payments/campaign/payment-qr/presign",
      hrToken,
      { method: "POST", body: qrRequest },
    );
    assert.equal(qrUpload.status, 201);
    const qrPayload = (await qrUpload.json()) as { key: string };
    assert.match(
      qrPayload.key,
      new RegExp(`^incoming/payment-qrs/[0-9a-f-]+/gcash/`),
    );
    assert.equal((await staffRequest("/membership-payments/campaign/open", financeToken, { method: "POST" })).status, 401);
    const opened = await staffRequest("/membership-payments/campaign/open", hrToken, { method: "POST" });
    assert.equal(opened.status, 200);
    const payload = (await opened.json()) as { eligible: number; created: number };
    assert.deepEqual(payload, { eligible: 3, officers: 0, members: 3, created: 3, emailDelivery: { queued: 3 } });
    const dashboard = await staffRequest("/membership-payments", hrToken);
    const dashboardBody = (await dashboard.json()) as {
      payments: { applicationId: string; birthday: string | null; gender: string | null; section: string | null; facebookUrl: string | null }[];
    };
    const accepted = dashboardBody.payments.find((payment) => payment.applicationId === ids.acceptedApplication);
    assert.deepEqual(accepted && [accepted.birthday, accepted.gender, accepted.section, accepted.facebookUrl], [
      "2005-06-15",
      "female",
      "3CSC",
      "https://facebook.com/accepted.applicant",
    ]);
    // Email is switched off in tests, so the background outbox fails them.
    assert.deepEqual(await runEmailOutbox({ budgetMs: 5_000 }), {
      skipped: false,
      sent: 0,
      failed: 3,
      deferred: 0,
      uncertain: 0,
    });
    assert.equal((await staffRequest("/membership-payments/emails/retry-invitations", financeToken, { method: "POST" })).status, 401);
    const invitationRetry = await staffRequest(
      "/membership-payments/emails/retry-invitations",
      hrToken,
      { method: "POST" },
    );
    assert.equal(invitationRetry.status, 200);
    assert.deepEqual(await invitationRetry.json(), { retried: 3 });
    await runEmailOutbox({ budgetMs: 5_000 });
    assert.equal((await db.select().from(membershipPayments)).filter((row) => row.applicationId === ids.archivedApplication).length, 0);
    const changedAmount = JSON.stringify({
      ...JSON.parse(details),
      amountCents: 30000,
    });
    assert.equal((await staffRequest("/membership-payments/campaign/payment-details", hrToken, { method: "PUT", body: changedAmount })).status, 409);
  });

  await t.test("applicant can see only their payment invitation", async () => {
    const response = await app.request("/applicant/payment", {
      headers: { Cookie: `applicant_token=${applicantToken}` },
    });
    assert.equal(response.status, 200);
    const payload = (await response.json()) as { payment: { applicationCode: string; memberId: string | null; amountCents: number } };
    assert.deepEqual(payload.payment, { ...payload.payment, applicationCode: "AP-2096-810001", memberId: null, amountCents: 25000 });
  });

  await t.test("HR verifies payment and Member ID is generated then", async () => {
    const [payment] = await db.select().from(membershipPayments).where(eq(membershipPayments.applicationId, ids.acceptedApplication));
    await db.insert(membershipPaymentSubmissions).values({
      paymentId: payment.id,
      campaignId: payment.campaignId,
      attemptNumber: 1,
      method: "gcash",
      referenceNumber: "REF-810001",
      referenceNumberNormalized: "REF810001",
      amountCents: 25000,
      receiptKey: `payment-receipts/${ids.acceptedApplication}/test.png`,
      receiptFileName: "receipt.png",
      receiptMimeType: "image/png",
      receiptSizeBytes: 100,
      receiptChecksumSha256: "A".repeat(43) + "=",
    });
    await db.update(membershipPayments).set({ status: "pending_verification" }).where(eq(membershipPayments.id, payment.id));
    assert.equal((await staffRequest(`/membership-payments/${payment.id}/verify`, financeToken, { method: "POST" })).status, 401);
    await db.update(applications).set({ archivedAt: new Date() }).where(eq(applications.id, ids.acceptedApplication));
    assert.equal((await staffRequest(`/membership-payments/${payment.id}/verify`, hrToken, { method: "POST" })).status, 409);
    await db.update(applications).set({ archivedAt: null }).where(eq(applications.id, ids.acceptedApplication));
    const verified = await staffRequest(`/membership-payments/${payment.id}/verify`, hrToken, { method: "POST" });
    assert.equal(verified.status, 200);
    const verifiedBody = (await verified.json()) as { memberId: string; emailDelivery: { sent: number; failed: number } };
    // 8 board seats + 0 EAs + 13 directors, so the first staff number is 22.
    assert.equal(verifiedBody.memberId, "AWS-9697-0022");
    assert.equal(verifiedBody.emailDelivery.sent + verifiedBody.emailDelivery.failed, 1);
    const verifiedEmails = await db.select().from(emailNotifications).where(eq(emailNotifications.applicationId, ids.acceptedApplication));
    assert.equal(verifiedEmails.filter((row) => row.messageType === "membership_verified").length, 1);
    const afterVerify = (await (await app.request("/applicant/payment", { headers: { Cookie: `applicant_token=${applicantToken}` } })).json()) as { payment: { memberCard: { memberId: string; position: string; photoUrl: string | null } | null; membersGroupLink: string | null } };
    assert.equal(afterVerify.payment.memberCard?.memberId, verifiedBody.memberId);
    assert.equal(afterVerify.payment.memberCard?.position, "Payment Staff");
    assert.equal(afterVerify.payment.memberCard?.photoUrl, null);
    assert.equal(afterVerify.payment.membersGroupLink, "https://m.me/j/general-test");
    const photoBody = JSON.stringify({ mimeType: "image/png", sizeBytes: 100, checksumSha256: "A".repeat(43) + "=" });
    const photoPresign = await app.request("/applicant/payment/member-photo/presign", { method: "POST", headers: { ...originHeaders(), "Content-Type": "application/json", Cookie: `applicant_token=${applicantToken}` }, body: photoBody });
    assert.equal(photoPresign.status, 201);
    assert.match(((await photoPresign.json()) as { key: string }).key, new RegExp(`^incoming/member-photos/${ids.acceptedApplication}/`));
    const [application] = await db.select({ memberId: applications.memberId }).from(applications).where(eq(applications.id, ids.acceptedApplication));
    assert.match(application.memberId ?? "", /^AWS-9697-\d{4}$/);

    const exported = await staffRequest("/membership-payments/export", hrToken);
    assert.equal(exported.status, 200);
    const csv = await exported.text();
    assert.match(csv, /"Birthday","Gender","Facebook link","Year level","Course","Section"/);
    assert.match(csv, /"2005-06-15","female","https:\/\/facebook\.com\/accepted\.applicant","3rd Year","CS","3CSC"/);
  });

  await t.test("HR can reject a receipt for resubmission", async () => {
    const [payment] = await db
      .select()
      .from(membershipPayments)
      .where(eq(membershipPayments.applicationId, ids.rejectedApplication));
    await db.insert(membershipPaymentSubmissions).values({
      paymentId: payment.id,
      campaignId: payment.campaignId,
      attemptNumber: 1,
      method: "gcash",
      referenceNumber: "REF-810002",
      referenceNumberNormalized: "REF810002",
      amountCents: 25000,
      receiptKey: `payment-receipts/${ids.rejectedApplication}/test.png`,
      receiptFileName: "receipt.png",
      receiptMimeType: "image/png",
      receiptSizeBytes: 100,
      receiptChecksumSha256: "B".repeat(43) + "=",
    });
    await db
      .update(membershipPayments)
      .set({ status: "pending_verification" })
      .where(eq(membershipPayments.id, payment.id));
    const body = JSON.stringify({ reason: "Receipt details do not match" });
    assert.equal(
      (
        await staffRequest(
          `/membership-payments/${payment.id}/reject`,
          financeToken,
          { method: "POST", body },
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await staffRequest(
          `/membership-payments/${payment.id}/reject`,
          hrToken,
          { method: "POST", body },
        )
      ).status,
      200,
    );
    const [rejected] = await db
      .select()
      .from(membershipPayments)
      .where(eq(membershipPayments.id, payment.id));
    assert.equal(rejected.status, "needs_resubmission");

    // They are told what to fix: an email carrying Finance's note and the new deadline.
    const [email] = await db
      .select({ id: emailNotifications.id })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.applicationId, ids.rejectedApplication),
          eq(emailNotifications.messageType, "payment_resubmission_needed"),
        ),
      );
    assert.ok(email);
    const prepared = await prepareQueuedEmail({
      id: email.id,
      messageType: "payment_resubmission_needed",
      recipient: "x@example.test",
      attempts: 0,
    });
    assert.equal(prepared.kind, "ready");
    if (prepared.kind === "ready") {
      assert.match(prepared.rendered.text, /Receipt details do not match/);
      // No date was picked: they resubmit by the payment period's own deadline.
      assert.match(prepared.rendered.text, /Resubmit by: December 1, 2096/);
    }
  });

  await t.test("there is no confirmation release; links are on the dashboard once verified", async () => {
    assert.equal((await staffRequest("/membership-payments/confirmations/release", hrToken, { method: "POST" })).status, 404);
    assert.equal((await staffRequest("/membership-payments/emails/retry-confirmations", hrToken, { method: "POST" })).status, 404);
    const dashboard = (await (await app.request("/applicant/payment", { headers: { Cookie: `applicant_token=${applicantToken}` } })).json()) as { payment: { membersGroupLink: string | null; committeeChatLink: string | null } };
    assert.equal(dashboard.payment.membersGroupLink, "https://m.me/j/general-test");
    assert.equal(dashboard.payment.committeeChatLink, "https://m.me/j/committee-test");
  });

  await t.test("HR can reverse verification and Member ID is retained", async () => {
    const [payment] = await db.select().from(membershipPayments).where(eq(membershipPayments.applicationId, ids.acceptedApplication));
    const body = JSON.stringify({ reason: "Wrong receipt was verified" });
    assert.equal((await staffRequest(`/membership-payments/${payment.id}/reverse`, financeToken, { method: "POST", body })).status, 401);
    assert.equal((await staffRequest(`/membership-payments/${payment.id}/reverse`, hrToken, { method: "POST", body })).status, 200);
    const [reversed] = await db.select().from(membershipPayments).where(eq(membershipPayments.id, payment.id));
    const [application] = await db.select({ memberId: applications.memberId }).from(applications).where(eq(applications.id, ids.acceptedApplication));
    assert.equal(reversed.membershipStatus, "revoked");
    assert.equal(reversed.status, "needs_resubmission");
    assert.match(application.memberId ?? "", /^AWS-9697-\d{4}$/);
  });

  await t.test("applicant submits a Google Drive receipt link that HR can open", async () => {
    const memberToken = (
      await signApplicantToken({
        applicationId: ids.memberApplication,
        applicationCode: "AP-2096-810003",
      })
    ).token;
    const submit = (receiptUrl: string, referenceNumber: string) =>
      app.request("/applicant/payment/submit", {
        method: "POST",
        headers: {
          ...originHeaders(),
          "Content-Type": "application/json",
          Cookie: `applicant_token=${memberToken}`,
        },
        body: JSON.stringify({ referenceNumber, receiptUrl }),
      });

    assert.equal((await submit("https://example.com/receipt.png", "REF-810003")).status, 400);
    assert.equal((await submit("http://drive.google.com/file/d/abc/view", "REF-810003")).status, 400);
    const driveLink = "https://drive.google.com/file/d/receipt-810003/view?usp=sharing";
    const submitted = await submit(driveLink, "REF-810003");
    assert.equal(submitted.status, 201);

    const [payment] = await db.select().from(membershipPayments).where(eq(membershipPayments.applicationId, ids.memberApplication));
    const [submission] = await db.select().from(membershipPaymentSubmissions).where(eq(membershipPaymentSubmissions.paymentId, payment.id));
    assert.equal(payment.status, "pending_verification");
    assert.equal(submission.method, "gcash");
    assert.equal(submission.receiptUrl, driveLink);
    assert.equal(submission.receiptKey, null);

    const receipt = await staffRequest(`/membership-payments/${payment.id}/receipts/${submission.id}`, hrToken);
    assert.equal(receipt.status, 200);
    assert.deepEqual(await receipt.json(), { url: driveLink });
  });

  await t.test("a receipt cannot be sent back once the payment deadline has passed", async () => {
    const [payment] = await db.select().from(membershipPayments).where(eq(membershipPayments.applicationId, ids.memberApplication));
    const [campaign] = await db.select().from(membershipPaymentCampaigns).where(eq(membershipPaymentCampaigns.id, payment.campaignId));
    await db.update(membershipPaymentCampaigns).set({ deadlineAt: new Date(Date.now() - 60_000) }).where(eq(membershipPaymentCampaigns.id, campaign.id));
    try {
      const response = await staffRequest(`/membership-payments/${payment.id}/reject`, hrToken, {
        method: "POST",
        body: JSON.stringify({ reason: "Receipt is blurry" }),
      });
      assert.equal(response.status, 409);
      assert.match(((await response.json()) as { error: string }).error, /Extend the deadline in Payment Setup/);
      const [unchanged] = await db.select().from(membershipPayments).where(eq(membershipPayments.id, payment.id));
      assert.equal(unchanged.status, "pending_verification");
    } finally {
      await db.update(membershipPaymentCampaigns).set({ deadlineAt: campaign.deadlineAt }).where(eq(membershipPaymentCampaigns.id, campaign.id));
    }
  });
});
