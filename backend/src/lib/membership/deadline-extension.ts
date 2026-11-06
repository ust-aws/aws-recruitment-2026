import { and, eq, inArray, isNotNull, isNull, lt, notInArray, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPaymentSubmissions,
  membershipPayments,
} from "../../db/schema";
import { recruitmentYearInt } from "../applications/application-code";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Statuses that still owe a payment; verified and under-review payments are left out. */
const OWING_STATUSES = ["awaiting_payment", "needs_resubmission"] as const;

/**
 * Lets everyone whose payment expired pay again until `deadline`: used when the
 * deadline moves later and when HR reopens payments. Someone whose receipt was
 * rejected or reversed goes back to resubmitting; everyone else to paying.
 */
export async function reopenExpiredPayments(tx: Tx, campaignId: string, deadline: Date) {
  const hadRejection = sql`exists (
    select 1 from ${membershipPaymentSubmissions}
    where ${membershipPaymentSubmissions.paymentId} = ${membershipPayments.id}
      and ${membershipPaymentSubmissions.status} in ('rejected', 'reversed')
  )`;
  await tx
    .update(membershipPayments)
    .set({
      status: sql`case when ${hadRejection} then 'needs_resubmission'::membership_payment_status else 'awaiting_payment'::membership_payment_status end`,
      // A stale resubmission deadline would expire them again on the next load.
      resubmissionDeadlineAt: sql`case when ${hadRejection} then ${deadline.toISOString()}::timestamptz else null end`,
      updatedAt: new Date(),
    })
    .where(and(eq(membershipPayments.campaignId, campaignId), eq(membershipPayments.status, "expired")));

  // A resubmission deadline that the new date overtakes would still lock the applicant out.
  await tx
    .update(membershipPayments)
    .set({ resubmissionDeadlineAt: deadline, updatedAt: new Date() })
    .where(
      and(
        eq(membershipPayments.campaignId, campaignId),
        eq(membershipPayments.status, "needs_resubmission"),
        isNotNull(membershipPayments.resubmissionDeadlineAt),
        lt(membershipPayments.resubmissionDeadlineAt, deadline),
      ),
    );
}

/**
 * "Expired" is worked out from the deadline and is no longer saved, but older
 * code saved it, and those rows stay stuck once payments reopen. While payments
 * are open and before the deadline, this lets them pay again. Cheap when none.
 */
export async function healSavedExpiry(campaignId?: string) {
  const [campaign] = await db
    .select({
      id: membershipPaymentCampaigns.id,
      isOpen: membershipPaymentCampaigns.isOpen,
      deadlineAt: membershipPaymentCampaigns.deadlineAt,
    })
    .from(membershipPaymentCampaigns)
    .where(
      campaignId
        ? eq(membershipPaymentCampaigns.id, campaignId)
        : eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYearInt()),
    )
    .limit(1);
  if (!campaign?.isOpen || new Date() > campaign.deadlineAt) return;
  await db.transaction((tx) => reopenExpiredPayments(tx, campaign.id, campaign.deadlineAt));
}

/**
 * When HR moves the payment deadline later: reopens payments that expired only
 * because of the old date, then queues one "deadline extended" email for
 * everyone who still owes a payment. People who paid, or whose receipt is
 * under review, hear nothing. Returns the queued notification ids.
 */
export async function extendPaymentDeadline(
  tx: Tx,
  campaignId: string,
  newDeadline: Date,
): Promise<string[]> {
  await reopenExpiredPayments(tx, campaignId, newDeadline);

  const owing = await tx
    .select({ applicationId: applications.id, recipient: applicants.email })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(
      and(
        eq(membershipPayments.campaignId, campaignId),
        inArray(membershipPayments.status, [...OWING_STATUSES]),
        isNull(applications.archivedAt),
        // Saving twice in a row must not email the same person twice.
        notInArray(
          applications.id,
          tx
            .select({ id: emailNotifications.applicationId })
            .from(emailNotifications)
            .where(
              and(
                eq(emailNotifications.messageType, "payment_deadline_extended"),
                inArray(emailNotifications.status, ["pending", "sending"]),
                isNotNull(emailNotifications.applicationId),
              ),
            ),
        ),
      ),
    );
  if (owing.length === 0) return [];

  const queued = await tx
    .insert(emailNotifications)
    .values(
      owing.map((row) => ({
        applicationId: row.applicationId,
        messageType: "payment_deadline_extended" as const,
        recipient: row.recipient,
      })),
    )
    .returning({ id: emailNotifications.id });
  return queued.map((row) => row.id);
}
