import assert from "node:assert/strict";
import test, { after } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  applicants,
  applications,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPayments,
} from "./db/schema";
import { executiveOfficeCommittees } from "./lib/apply/committee-office-groups";
import { lookupOfficerRecipient } from "./lib/email/officer-recipients";
import { sendPaymentInvitations } from "./lib/membership/email-delivery";
import { HELD_WELCOME_UNTIL, seedOfficers } from "./lib/membership/officer-seeding";

const databaseUrl = process.env.DATABASE_URL ?? "";
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.replace(/^\/+/, "") : "";
if (!databaseUrl || !/(^|[_-])test([_-]|$)/i.test(databaseName)) {
  throw new Error("Held payment email tests require a test database.");
}

const YEAR = 2093;
process.env.RECRUITMENT_YEAR = String(YEAR);
process.env.EMAIL_ENABLED = "false";

after(async () => {
  try {
    await db.delete(membershipPaymentCampaigns).where(eq(membershipPaymentCampaigns.recruitmentYear, YEAR));
    const rows = await db
      .select({ applicantId: applications.applicantId })
      .from(applications)
      .where(eq(applications.recruitmentYear, YEAR));
    await db.delete(applications).where(eq(applications.recruitmentYear, YEAR));
    if (rows.length > 0) {
      await db.delete(applicants).where(inArray(applicants.id, rows.map((row) => row.applicantId)));
    }
  } finally {
    await db.$client.end();
  }
});

test("sending from Payment Emails releases an officer's held emails", async () => {
  await db.insert(membershipPaymentCampaigns).values({
    recruitmentYear: YEAR,
    amountCents: 25_000,
    opensAt: new Date(Date.now() - 60_000),
    deadlineAt: new Date(Date.now() + 86_400_000),
    gcashAccountNumber: "09170000000",
    isOpen: true,
  });
  const email = lookupOfficerRecipient(executiveOfficeCommittees()[0])?.email;
  assert.ok(email);
  // Seeded on hold while payments are open: welcome and payment email both parked.
  const seeded = await seedOfficers(YEAR, { onlyEmails: [email], holdWelcome: true });
  assert.equal(seeded.paymentInvitationIds.length, 1);

  const [payment] = await db
    .select({ id: membershipPayments.id, applicationId: membershipPayments.applicationId })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .where(eq(applications.recruitmentYear, YEAR));
  const emails = () =>
    db
      .select({ messageType: emailNotifications.messageType, nextAttemptAt: emailNotifications.nextAttemptAt })
      .from(emailNotifications)
      .where(
        and(
          eq(emailNotifications.applicationId, payment.applicationId),
          inArray(emailNotifications.messageType, ["payment_invitation", "officer_welcome"]),
        ),
      );
  assert.deepEqual(
    (await emails()).map((row) => row.nextAttemptAt?.getTime()).sort(),
    [HELD_WELCOME_UNTIL.getTime(), HELD_WELCOME_UNTIL.getTime()],
  );

  assert.deepEqual(await sendPaymentInvitations([payment.id]), { queued: 1, alreadyWaiting: 0 });
  const released = await emails();
  assert.equal(released.length, 2);
  for (const row of released) {
    assert.ok(row.nextAttemptAt && row.nextAttemptAt <= new Date(), `${row.messageType} is due now`);
  }

  // Already due: nothing new is made, and the caller starts the sender for it.
  assert.deepEqual(await sendPaymentInvitations([payment.id]), { queued: 0, alreadyWaiting: 1 });
  assert.equal((await emails()).length, 2);
});
