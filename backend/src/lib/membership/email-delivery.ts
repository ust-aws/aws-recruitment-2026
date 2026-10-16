import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  committees,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPaymentSubmissions,
  membershipPayments,
  officerSeats,
  positions,
} from "../../db/schema";
import {
  markUncertainDelivered,
  requeueFailed,
  type ClaimedNotification,
  type PreparedEmail,
} from "../email/outbox";
import {
  renderMembershipVerified,
  renderOfficerPaymentInvitation,
  renderPaymentDeadlineExtended,
  renderPaymentInvitation,
  renderPaymentResubmission,
} from "../email/service";
import { recruitmentYearInt } from "../applications/application-code";
import { MembershipPaymentError } from "./errors";
import { memberPositionLabel } from "./member-position";
import { officerReservedMemberId } from "./officer-email";

/** Renders a queued payment invitation or verified-member email. */
export async function prepareMembershipNotification(
  notification: ClaimedNotification,
): Promise<PreparedEmail> {
  const [row] = await db
    .select({
      applicationCode: applications.applicationCode,
      applicationType: applications.applicationType,
      applicationStatus: applications.status,
      lastName: applicants.lastName,
      memberId: applications.memberId,
      position: positions.name,
      committeeName: committees.name,
      officerTitle: officerSeats.title,
      officerKind: officerSeats.kind,
      officerCommittee: officerSeats.committee,
      recruitmentYear: applications.recruitmentYear,
      amountCents: membershipPaymentCampaigns.amountCents,
      deadlineAt: membershipPaymentCampaigns.deadlineAt,
      resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt,
      paymentId: membershipPayments.id,
      reversalReason: membershipPayments.reversalReason,
    })
    .from(emailNotifications)
    .innerJoin(applications, eq(emailNotifications.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(membershipPayments, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(eq(emailNotifications.id, notification.id))
    .limit(1);
  if (!row) return { kind: "invalid", error: "Membership payment for this email was not found." };
  if (row.amountCents === null) {
    return { kind: "invalid", error: "Membership payment amount is not configured." };
  }

  if (notification.messageType === "payment_invitation" && row.officerTitle && row.officerKind) {
    return {
      kind: "ready",
      rendered: renderOfficerPaymentInvitation({
        lastName: row.lastName,
        title: row.officerTitle,
        memberId: await officerReservedMemberId({
          memberId: row.memberId,
          recruitmentYear: row.recruitmentYear,
          kind: row.officerKind,
          committee: row.officerCommittee,
        }),
        applicationCode: row.applicationCode,
        amountCents: row.amountCents,
        deadlineAt: row.deadlineAt,
      }),
    };
  }
  if (notification.messageType === "payment_invitation") {
    return {
      kind: "ready",
      rendered: renderPaymentInvitation({
        lastName: row.lastName,
        applicationCode: row.applicationCode,
        amountCents: row.amountCents,
        deadlineAt: row.deadlineAt,
      }),
    };
  }
  if (notification.messageType === "payment_resubmission_needed") {
    // The note Finance gave: on the turned-down receipt, or on the reversal of a verified one.
    const [latest] = await db
      .select({
        status: membershipPaymentSubmissions.status,
        reviewReason: membershipPaymentSubmissions.reviewReason,
      })
      .from(membershipPaymentSubmissions)
      .where(eq(membershipPaymentSubmissions.paymentId, row.paymentId))
      .orderBy(desc(membershipPaymentSubmissions.attemptNumber))
      .limit(1);
    const reversed = latest?.status === "reversed";
    const reason = (reversed ? row.reversalReason : latest?.reviewReason) ?? "";
    if (!reason) return { kind: "invalid", error: "This payment has no review note to send." };
    return {
      kind: "ready",
      rendered: renderPaymentResubmission({
        lastName: row.lastName,
        applicationCode: row.applicationCode,
        amountCents: row.amountCents,
        deadlineAt: row.resubmissionDeadlineAt ?? row.deadlineAt,
        reason,
        reversed,
      }),
    };
  }
  if (notification.messageType === "payment_deadline_extended") {
    return {
      kind: "ready",
      rendered: renderPaymentDeadlineExtended({
        lastName: row.lastName,
        applicationCode: row.applicationCode,
        amountCents: row.amountCents,
        // Someone asked to resubmit has their own deadline, which may be later than the campaign's.
        deadlineAt: row.resubmissionDeadlineAt ?? row.deadlineAt,
      }),
    };
  }
  if (notification.messageType === "membership_verified") {
    if (!row.memberId) return { kind: "invalid", error: "Member ID has not been assigned." };
    return {
      kind: "ready",
      rendered: renderMembershipVerified({
        lastName: row.lastName,
        memberId: row.memberId,
        position: memberPositionLabel({
          applicationType: row.applicationType,
          applicationStatus: row.applicationStatus,
          positionName: row.position,
          committeeName: row.committeeName,
          officerTitle: row.officerTitle,
        }),
      }),
    };
  }
  return { kind: "invalid", error: "Unsupported membership email type." };
}

/** Requeues failed membership emails of one type for the background sender. */
export async function retryFailedMembershipEmails(
  messageType: "payment_invitation" | "membership_verified",
) {
  const retried = await requeueFailed({
    messageTypes: [messageType],
    recruitmentYear: recruitmentYearInt(),
    uncertain: false,
  });
  return { retried };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type LatestInvitation = { id: string; status: string; nextAttemptAt: Date | null };

/** The newest payment invitation per application, for deciding what a resend should do. */
async function latestInvitations(executor: Tx | typeof db, applicationIds: string[]) {
  if (applicationIds.length === 0) return new Map<string, LatestInvitation>();
  const rows = await executor
    .select({
      id: emailNotifications.id,
      applicationId: emailNotifications.applicationId,
      status: emailNotifications.status,
      nextAttemptAt: emailNotifications.nextAttemptAt,
    })
    .from(emailNotifications)
    .where(
      and(
        eq(emailNotifications.messageType, "payment_invitation"),
        inArray(emailNotifications.applicationId, applicationIds),
      ),
    )
    .orderBy(desc(emailNotifications.createdAt));
  const latest = new Map<string, LatestInvitation>();
  for (const row of rows) {
    if (row.applicationId && !latest.has(row.applicationId)) {
      latest.set(row.applicationId, { id: row.id, status: row.status, nextAttemptAt: row.nextAttemptAt });
    }
  }
  return latest;
}

/**
 * Sends the payment invitation to the chosen people, whatever its state:
 * a new email for anyone who never had one (or who has one that was sent and
 * needs another), the same email again for one that failed or may not have
 * arrived, and right away for one held back or scheduled for later (an officer
 * seeded on hold, with their held welcome email released alongside). An email
 * already due is left alone; the caller starts the sender for it.
 */
export async function sendPaymentInvitations(paymentIds: readonly string[]) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        applicationId: applications.id,
        recipient: applicants.email,
        isOpen: membershipPaymentCampaigns.isOpen,
      })
      .from(membershipPayments)
      .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .innerJoin(
        membershipPaymentCampaigns,
        eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
      )
      .where(
        and(
          inArray(membershipPayments.id, [...paymentIds]),
          eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYearInt()),
          isNull(applications.archivedAt),
        ),
      );
    if (rows.some((row) => !row.isOpen)) {
      throw new MembershipPaymentError("Open payments before sending invitations.", 409);
    }
    const latest = await latestInvitations(tx, rows.map((row) => row.applicationId));

    const toCreate = rows.filter((row) => {
      const status = latest.get(row.applicationId)?.status;
      return status === undefined || status === "sent";
    });
    const toRequeue = rows.flatMap((row) => {
      const current = latest.get(row.applicationId);
      return current?.status === "failed" ? [current.id] : [];
    });
    const now = new Date();
    const held = rows.filter((row) => {
      const current = latest.get(row.applicationId);
      return current?.status === "pending" && current.nextAttemptAt !== null && current.nextAttemptAt > now;
    });
    const waiting = rows.length - toCreate.length - toRequeue.length - held.length;

    if (toCreate.length > 0) {
      await tx.insert(emailNotifications).values(
        toCreate.map((row) => ({
          applicationId: row.applicationId,
          messageType: "payment_invitation" as const,
          recipient: row.recipient,
        })),
      );
    }
    if (toRequeue.length > 0) {
      await tx
        .update(emailNotifications)
        .set({ status: "pending", nextAttemptAt: new Date(), claimedAt: null })
        .where(inArray(emailNotifications.id, toRequeue));
    }
    if (held.length > 0) {
      await tx
        .update(emailNotifications)
        .set({ nextAttemptAt: now, claimedAt: null })
        .where(
          and(
            inArray(emailNotifications.messageType, ["payment_invitation", "officer_welcome"]),
            eq(emailNotifications.status, "pending"),
            gt(emailNotifications.nextAttemptAt, now),
            inArray(emailNotifications.applicationId, held.map((row) => row.applicationId)),
          ),
        );
    }
    return { queued: toCreate.length + toRequeue.length + held.length, alreadyWaiting: waiting };
  });
}

/** Counts the chosen people's uncertain invitations as sent, after HR found them in the Sent folder. */
export async function markPaymentInvitationsDelivered(paymentIds: readonly string[]) {
  const payments = await db
    .select({ applicationId: membershipPayments.applicationId })
    .from(membershipPayments)
    .where(inArray(membershipPayments.id, [...paymentIds]));
  const latest = await latestInvitations(db, payments.map((payment) => payment.applicationId));
  const marked = await markUncertainDelivered({
    ids: [...latest.values()].map((invitation) => invitation.id),
    messageTypes: ["payment_invitation"],
    recruitmentYear: recruitmentYearInt(),
  });
  return { marked };
}
