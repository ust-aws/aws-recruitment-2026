import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  applicants,
  applications,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPayments,
  membershipPaymentSubmissions,
  users,
} from "./db/schema";
import { prepareQueuedEmail } from "./lib/email/queued-emails";
import type { AuthenticatedUser } from "./auth";
import { openCurrentPaymentCampaign, saveCurrentPaymentSchedule } from "./lib/membership/campaigns";

const databaseUrl = process.env.DATABASE_URL ?? "";
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.replace(/^\/+/, "") : "";
if (!databaseUrl || !/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Payment deadline extension tests require a test database.");
}

process.env.RECRUITMENT_YEAR = "2095";

const YEAR = 2095;
const applicantIds: string[] = [];
const hrUserId = randomUUID();

after(async () => {
  try {
    await db.delete(membershipPaymentCampaigns).where(eq(membershipPaymentCampaigns.recruitmentYear, YEAR));
    if (applicantIds.length > 0) await db.delete(applicants).where(inArray(applicants.id, applicantIds));
    await db.delete(users).where(eq(users.id, hrUserId));
  } finally {
    await db.$client.end();
  }
});

type PaymentStatus = typeof membershipPayments.$inferInsert.status;

let codeCounter = 0;

/** One applicant with a member application and a payment row in the given state. */
async function payer(
  campaignId: string,
  status: PaymentStatus,
  extra: { archived?: boolean; resubmissionDeadlineAt?: Date; rejectedReceipt?: boolean } = {},
) {
  const applicantId = randomUUID();
  const applicationId = randomUUID();
  applicantIds.push(applicantId);
  codeCounter += 1;
  await db.insert(applicants).values({
    id: applicantId,
    firstName: "Extend",
    lastName: `Payer${codeCounter}`,
    email: `extend-${applicantId}@ust.edu.ph`,
  });
  await db.insert(applications).values({
    id: applicationId,
    applicantId,
    applicationCode: `AP-${YEAR}-9${String(codeCounter).padStart(5, "0")}`,
    recruitmentYear: YEAR,
    applicationType: "member",
    status: "approved",
    archivedAt: extra.archived ? new Date() : null,
  });
  const [payment] = await db
    .insert(membershipPayments)
    .values({
      campaignId,
      applicationId,
      status,
      resubmissionDeadlineAt: extra.resubmissionDeadlineAt ?? null,
    })
    .returning({ id: membershipPayments.id });
  if (extra.rejectedReceipt) {
    await db.insert(membershipPaymentSubmissions).values({
      paymentId: payment.id,
      campaignId,
      attemptNumber: 1,
      method: "gcash",
      referenceNumber: `REF-${codeCounter}`,
      referenceNumberNormalized: `ref${codeCounter}`,
      amountCents: 25000,
      receiptUrl: "https://drive.google.com/file/d/test/view",
      status: "rejected",
    });
  }
  return { applicationId, paymentId: payment.id };
}

async function statusOf(paymentId: string) {
  const [row] = await db
    .select({ status: membershipPayments.status, resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt })
    .from(membershipPayments)
    .where(eq(membershipPayments.id, paymentId));
  return row;
}

async function extensionEmailsFor(applicationIds: string[]) {
  const rows = await db
    .select({ applicationId: emailNotifications.applicationId })
    .from(emailNotifications)
    .where(inArray(emailNotifications.applicationId, applicationIds));
  return new Set(rows.map((row) => row.applicationId));
}

function schedule(deadlineAt: Date) {
  return {
    opensAt: new Date("2026-01-01T00:00:00.000Z"),
    deadlineAt,
    generalChatLink: null,
    committeeChatLinks: [],
  };
}

test("extending the payment deadline", async (t) => {
  const oldDeadline = new Date("2026-02-01T00:00:00.000Z");
  const newDeadline = new Date("2095-12-01T00:00:00.000Z");
  const [campaign] = await db
    .insert(membershipPaymentCampaigns)
    .values({
      recruitmentYear: YEAR,
      opensAt: new Date("2026-01-01T00:00:00.000Z"),
      deadlineAt: oldDeadline,
      amountCents: 25000,
      gcashAccountName: "AWS Builders - UST",
      gcashAccountNumber: "09171234567",
      isOpen: true,
    })
    .returning({ id: membershipPaymentCampaigns.id });

  const awaiting = await payer(campaign.id, "awaiting_payment");
  const expiredNeverPaid = await payer(campaign.id, "expired");
  const expiredRejected = await payer(campaign.id, "expired", { rejectedReceipt: true });
  const resubmitting = await payer(campaign.id, "needs_resubmission", {
    resubmissionDeadlineAt: new Date("2026-02-10T00:00:00.000Z"),
    rejectedReceipt: true,
  });
  const underReview = await payer(campaign.id, "pending_verification");
  const paid = await payer(campaign.id, "verified");
  const archived = await payer(campaign.id, "awaiting_payment", { archived: true });
  const owing = [awaiting, expiredNeverPaid, expiredRejected, resubmitting];
  const everyone = [...owing, underReview, paid, archived].map((row) => row.applicationId);

  await t.test("emails only the people who still owe a payment, and reopens expired ones", async () => {
    const saved = await saveCurrentPaymentSchedule(schedule(newDeadline));
    assert.equal(saved.extensionNotificationIds.length, 4);
    assert.deepEqual(
      await extensionEmailsFor(everyone),
      new Set(owing.map((row) => row.applicationId)),
    );

    assert.equal((await statusOf(expiredNeverPaid.paymentId)).status, "awaiting_payment");
    assert.equal((await statusOf(expiredRejected.paymentId)).status, "needs_resubmission");
    assert.equal((await statusOf(underReview.paymentId)).status, "pending_verification");
    assert.equal((await statusOf(paid.paymentId)).status, "verified");
    // The old resubmission date would still lock this applicant out of the new deadline.
    assert.equal((await statusOf(resubmitting.paymentId)).resubmissionDeadlineAt?.toISOString(), newDeadline.toISOString());
  });

  await t.test("the email shows the new deadline", async () => {
    const [notification] = await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.applicationId, awaiting.applicationId));
    assert.equal(notification.messageType, "payment_deadline_extended");
    const prepared = await prepareQueuedEmail({ ...notification, status: "sending" } as never);
    assert.equal(prepared.kind, "ready");
    if (prepared.kind !== "ready") return;
    assert.match(prepared.rendered.subject, /^Payment deadline extended/);
    assert.match(prepared.rendered.text, /December 1, 2095/);
  });

  await t.test("saving again does not email anyone twice", async () => {
    const later = new Date("2096-01-01T00:00:00.000Z");
    const saved = await saveCurrentPaymentSchedule(schedule(later));
    assert.equal(saved.extensionNotificationIds.length, 0);
  });

  await t.test("a deadline that is not later sends nothing", async () => {
    await db.delete(emailNotifications).where(inArray(emailNotifications.applicationId, everyone));
    const saved = await saveCurrentPaymentSchedule(schedule(new Date("2095-06-01T00:00:00.000Z")));
    assert.equal(saved.extensionNotificationIds.length, 0);
  });

  await t.test("nothing is sent while payments are closed", async () => {
    await db
      .update(membershipPaymentCampaigns)
      .set({ isOpen: false })
      .where(eq(membershipPaymentCampaigns.id, campaign.id));
    const saved = await saveCurrentPaymentSchedule(schedule(new Date("2097-01-01T00:00:00.000Z")));
    assert.equal(saved.extensionNotificationIds.length, 0);
  });

  await t.test("reopening payments lets everyone who expired pay again", async () => {
    // Saved as expired by an applicant who looked after the old deadline, while payments were closed.
    await db
      .update(membershipPayments)
      .set({ status: "expired", resubmissionDeadlineAt: new Date("2026-02-10T00:00:00.000Z") })
      .where(inArray(membershipPayments.id, [expiredNeverPaid.paymentId, expiredRejected.paymentId]));
    await db.insert(users).values({ id: hrUserId, email: `${hrUserId}@test.dev`, passwordHash: "x", firstName: "HR", lastName: "User", role: "hr" });

    await openCurrentPaymentCampaign({ id: hrUserId, email: `${hrUserId}@test.dev`, role: "hr" } as AuthenticatedUser);

    const reopened = await statusOf(expiredNeverPaid.paymentId);
    assert.equal(reopened.status, "awaiting_payment");
    assert.equal(reopened.resubmissionDeadlineAt, null);
    const resubmit = await statusOf(expiredRejected.paymentId);
    assert.equal(resubmit.status, "needs_resubmission");
    assert.equal(resubmit.resubmissionDeadlineAt?.toISOString(), "2097-01-01T00:00:00.000Z");
    assert.equal((await statusOf(paid.paymentId)).status, "verified");
  });
});
