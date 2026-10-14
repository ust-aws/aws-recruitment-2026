import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { AuthenticatedUser } from "../../auth";
import { db } from "../../db";
import {
  applicants,
  applications,
  committees,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPayments,
  membershipPaymentSubmissions,
  officerSeats,
  positions,
  users,
} from "../../db/schema";
import { recruitmentYearInt } from "../applications/application-code";
import { isExecutiveOfficeCommittee } from "../apply/committee-office-groups";
import {
  allocateMemberId,
  formatMemberId,
  MemberIdSeatTakenError,
  type MemberPlacement,
} from "../core/member-id";
import { UNCERTAIN_PREFIX } from "../email/outbox";
import { MembershipPaymentError } from "./errors";
import { createPaymentReceiptDownload } from "./receipts";

function displayStatus(row: {
  status: (typeof membershipPayments.$inferSelect)["status"];
  deadlineAt: Date;
  resubmissionDeadlineAt: Date | null;
}) {
  if (
    (row.status === "awaiting_payment" || row.status === "needs_resubmission") &&
    new Date() > (row.resubmissionDeadlineAt ?? row.deadlineAt)
  ) {
    return "expired" as const;
  }
  return row.status;
}

/** Where one person's payment invitation stands, for the payments list. */
export type InvitationStatus = "none" | "queued" | "sent" | "failed" | "uncertain";

/** The newest payment invitation per application, so HR can see who has not received theirs. */
async function invitationStatuses(applicationIds: string[]) {
  if (applicationIds.length === 0) return new Map<string, InvitationStatus>();
  const rows = await db
    .select({
      applicationId: emailNotifications.applicationId,
      status: emailNotifications.status,
      lastError: emailNotifications.lastError,
    })
    .from(emailNotifications)
    .where(
      and(
        eq(emailNotifications.messageType, "payment_invitation"),
        inArray(emailNotifications.applicationId, applicationIds),
      ),
    )
    .orderBy(desc(emailNotifications.createdAt));
  const byApplication = new Map<string, InvitationStatus>();
  for (const row of rows) {
    if (!row.applicationId || byApplication.has(row.applicationId)) continue;
    byApplication.set(
      row.applicationId,
      row.status === "sent"
        ? "sent"
        : row.status === "failed"
          ? row.lastError?.startsWith(UNCERTAIN_PREFIX)
            ? "uncertain"
            : "failed"
          : "queued",
    );
  }
  return byApplication;
}

export async function listMembershipPayments() {
  const recruitmentYear = recruitmentYearInt();
  const rows = await db
    .select({
      paymentId: membershipPayments.id,
      applicationId: applications.id,
      applicationCode: applications.applicationCode,
      applicationType: applications.applicationType,
      applicationStatus: applications.status,
      archivedAt: applications.archivedAt,
      memberId: applications.memberId,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      email: applicants.email,
      birthday: applicants.birthday,
      gender: applicants.gender,
      section: applicants.section,
      facebookUrl: applicants.facebookUrl,
      status: membershipPayments.status,
      membershipStatus: membershipPayments.membershipStatus,
      verifiedAt: membershipPayments.verifiedAt,
      resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt,
      deadlineAt: membershipPaymentCampaigns.deadlineAt,
      finalPosition: positions.name,
      committee: committees.name,
      officerTitle: officerSeats.title,
      officerCommittee: officerSeats.committee,
    })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
    .orderBy(desc(membershipPayments.updatedAt));

  const paymentIds = rows.map((row) => row.paymentId);
  const submissions =
    paymentIds.length === 0
      ? []
      : await db
          .select({
            paymentId: membershipPaymentSubmissions.paymentId,
            id: membershipPaymentSubmissions.id,
            attemptNumber: membershipPaymentSubmissions.attemptNumber,
            method: membershipPaymentSubmissions.method,
            referenceNumber: membershipPaymentSubmissions.referenceNumber,
            status: membershipPaymentSubmissions.status,
            submittedAt: membershipPaymentSubmissions.submittedAt,
            reviewReason: membershipPaymentSubmissions.reviewReason,
          })
          .from(membershipPaymentSubmissions)
          .where(inArray(membershipPaymentSubmissions.paymentId, paymentIds))
          .orderBy(desc(membershipPaymentSubmissions.attemptNumber));
  const latestByPayment = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!latestByPayment.has(submission.paymentId)) {
      latestByPayment.set(submission.paymentId, submission);
    }
  }

  const invitations = await invitationStatuses(rows.map((row) => row.applicationId));
  const payments = rows.map(({ officerTitle, officerCommittee, ...row }) => ({
    ...row,
    invitation: invitations.get(row.applicationId) ?? ("none" as InvitationStatus),
    finalPosition: row.finalPosition ?? officerTitle,
    committee: row.committee ?? officerCommittee,
    status: displayStatus(row),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    resubmissionDeadlineAt: row.resubmissionDeadlineAt?.toISOString() ?? null,
    deadlineAt: row.deadlineAt.toISOString(),
    latestSubmission: latestByPayment.has(row.paymentId)
      ? {
          ...latestByPayment.get(row.paymentId)!,
          submittedAt: latestByPayment
            .get(row.paymentId)!
            .submittedAt.toISOString(),
        }
      : null,
  }));
  const count = (status: string) =>
    payments.filter((payment) => payment.status === status).length;
  return {
    summary: {
      totalEligible: payments.length,
      awaitingPayment: count("awaiting_payment"),
      pendingVerification: count("pending_verification"),
      verified: count("verified"),
      needsResubmission: count("needs_resubmission"),
      expired: count("expired"),
    },
    payments,
  };
}

export async function getMembershipPaymentDetails(paymentId: string) {
  const list = await listMembershipPayments();
  const payment = list.payments.find((row) => row.paymentId === paymentId);
  if (!payment) throw new MembershipPaymentError("Payment not found.", 404);
  const submissions = await db
    .select({
      id: membershipPaymentSubmissions.id,
      attemptNumber: membershipPaymentSubmissions.attemptNumber,
      method: membershipPaymentSubmissions.method,
      referenceNumber: membershipPaymentSubmissions.referenceNumber,
      amountCents: membershipPaymentSubmissions.amountCents,
      receiptUrl: membershipPaymentSubmissions.receiptUrl,
      receiptFileName: membershipPaymentSubmissions.receiptFileName,
      receiptMimeType: membershipPaymentSubmissions.receiptMimeType,
      receiptSizeBytes: membershipPaymentSubmissions.receiptSizeBytes,
      status: membershipPaymentSubmissions.status,
      submittedAt: membershipPaymentSubmissions.submittedAt,
      reviewedAt: membershipPaymentSubmissions.reviewedAt,
      reviewReason: membershipPaymentSubmissions.reviewReason,
      reviewerEmail: users.email,
    })
    .from(membershipPaymentSubmissions)
    .leftJoin(users, eq(membershipPaymentSubmissions.reviewedBy, users.id))
    .where(eq(membershipPaymentSubmissions.paymentId, paymentId))
    .orderBy(desc(membershipPaymentSubmissions.attemptNumber));
  return {
    ...payment,
    submissions: submissions.map((submission) => ({
      ...submission,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    })),
  };
}

/** Executive associate, committee staff, or general member, from the accepted placement. */
async function memberPlacement(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  applicationId: string,
): Promise<MemberPlacement> {
  const [row] = await tx
    .select({
      applicationType: applications.applicationType,
      status: applications.status,
      committee: committees.name,
      seatKind: officerSeats.kind,
      seatCommittee: officerSeats.committee,
      seatKey: officerSeats.seatKey,
      seatOrder: officerSeats.sortOrder,
    })
    .from(applications)
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (row?.seatKind === "eb" && row.seatCommittee) {
    return { kind: "eb", officeCommittee: row.seatCommittee };
  }
  if (row?.seatKind === "director" && row.seatCommittee) {
    return { kind: "director", committee: row.seatCommittee };
  }
  // An officer-hunt EA takes the next free number in their office's block, like an R101 EA.
  if (row?.seatKind === "ea" && row.seatCommittee) {
    return { kind: "ea", officeCommittee: row.seatCommittee };
  }
  if (row?.seatKind === "adviser") return { kind: "adviser", index: row.seatOrder ?? 0 };
  if (!row?.committee || row.applicationType !== "position" || row.status !== "approved") {
    return { kind: "general" };
  }
  return isExecutiveOfficeCommittee(row.committee)
    ? { kind: "ea", officeCommittee: row.committee }
    : { kind: "staff" };
}

async function lockedPendingSubmission(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  paymentId: string,
) {
  const [payment] = await tx
    .select({
      id: membershipPayments.id,
      applicationId: membershipPayments.applicationId,
      status: membershipPayments.status,
      recruitmentYear: applications.recruitmentYear,
      memberId: applications.memberId,
      archivedAt: applications.archivedAt,
      deadlineAt: membershipPaymentCampaigns.deadlineAt,
    })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .where(eq(membershipPayments.id, paymentId))
    .for("update")
    .limit(1);
  if (!payment) throw new MembershipPaymentError("Payment not found.", 404);
  if (payment.status !== "pending_verification") {
    throw new MembershipPaymentError(
      "Only pending payments can be reviewed.",
      409,
    );
  }
  const [submission] = await tx
    .select()
    .from(membershipPaymentSubmissions)
    .where(
      and(
        eq(membershipPaymentSubmissions.paymentId, paymentId),
        eq(membershipPaymentSubmissions.status, "pending"),
      ),
    )
    .orderBy(desc(membershipPaymentSubmissions.attemptNumber))
    .for("update")
    .limit(1);
  if (!submission) {
    throw new MembershipPaymentError("Pending receipt not found.", 409);
  }
  return { payment, submission };
}

export async function verifyMembershipPayment(
  paymentId: string,
  actor: AuthenticatedUser,
) {
  return db.transaction(async (tx) => {
    const { payment, submission } = await lockedPendingSubmission(tx, paymentId);
    if (payment.archivedAt) {
      throw new MembershipPaymentError(
        "Restore this application before verifying its payment.",
        409,
      );
    }
    let memberId = payment.memberId;
    if (!memberId) {
      try {
        memberId = await allocateMemberId(
          tx,
          payment.recruitmentYear,
          await memberPlacement(tx, payment.applicationId),
        );
      } catch (error) {
        if (!(error instanceof MemberIdSeatTakenError)) throw error;
        throw new MembershipPaymentError(
          `Member ID ${formatMemberId(payment.recruitmentYear, error.sequence)} is reserved for this seat but another member already holds it. Free that ID first, then verify again.`,
          409,
        );
      }
      await tx
        .update(applications)
        .set({ memberId, updatedAt: new Date() })
        .where(eq(applications.id, payment.applicationId));
    }
    const reviewedAt = new Date();
    await tx
      .update(membershipPaymentSubmissions)
      .set({
        status: "verified",
        reviewedAt,
        reviewedBy: actor.id,
        reviewReason: null,
      })
      .where(eq(membershipPaymentSubmissions.id, submission.id));
    await tx
      .update(membershipPayments)
      .set({
        status: "verified",
        membershipStatus: "active",
        verifiedAt: reviewedAt,
        verifiedBy: actor.id,
        reversedAt: null,
        reversedBy: null,
        reversalReason: null,
        updatedAt: reviewedAt,
      })
      .where(eq(membershipPayments.id, paymentId));
    const [{ recipient }] = await tx
      .select({ recipient: applicants.email })
      .from(applications)
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .where(eq(applications.id, payment.applicationId));
    const [notification] = await tx
      .insert(emailNotifications)
      .values({
        applicationId: payment.applicationId,
        messageType: "membership_verified" as const,
        recipient,
      })
      .returning({ id: emailNotifications.id });
    return {
      paymentId,
      memberId,
      verifiedAt: reviewedAt.toISOString(),
      notificationId: notification.id,
    };
  });
}

/**
 * A payment sent back for another receipt is resubmitted by the payment period's
 * deadline (Payment Setup). Once that has passed there is nothing to resubmit
 * against, so the deadline has to be extended first.
 */
function assertDeadlineAllowsResubmission(deadlineAt: Date, now: Date) {
  if (now > deadlineAt) {
    throw new MembershipPaymentError(
      "The payment deadline has passed, so they could not resubmit. Extend the deadline in Payment Setup first, then try again.",
      409,
    );
  }
}

/** Queues the email that tells someone their payment needs another receipt, with Finance's note. */
async function queueResubmissionEmail(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  applicationId: string,
) {
  const [{ recipient }] = await tx
    .select({ recipient: applicants.email })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(eq(applications.id, applicationId));
  const [notification] = await tx
    .insert(emailNotifications)
    .values({
      applicationId,
      messageType: "payment_resubmission_needed" as const,
      recipient,
    })
    .returning({ id: emailNotifications.id });
  return notification.id;
}

export async function rejectMembershipPayment(
  paymentId: string,
  actor: AuthenticatedUser,
  reason: string,
) {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new MembershipPaymentError("A rejection reason is required.");
  }
  return db.transaction(async (tx) => {
    const { payment, submission } = await lockedPendingSubmission(tx, paymentId);
    const reviewedAt = new Date();
    assertDeadlineAllowsResubmission(payment.deadlineAt, reviewedAt);
    await tx
      .update(membershipPaymentSubmissions)
      .set({
        status: "rejected",
        reviewedAt,
        reviewedBy: actor.id,
        reviewReason: cleanReason,
      })
      .where(eq(membershipPaymentSubmissions.id, submission.id));
    await tx
      .update(membershipPayments)
      .set({
        status: "needs_resubmission",
        // They resubmit by the payment period's own deadline, set in Payment Setup.
        resubmissionDeadlineAt: null,
        updatedAt: reviewedAt,
      })
      .where(eq(membershipPayments.id, paymentId));
    return {
      paymentId,
      status: "needs_resubmission" as const,
      notificationId: await queueResubmissionEmail(tx, payment.applicationId),
    };
  });
}

export async function reverseMembershipPayment(
  paymentId: string,
  actor: AuthenticatedUser,
  reason: string,
) {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new MembershipPaymentError("A reversal reason is required.");
  }
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select({
        status: membershipPayments.status,
        applicationId: membershipPayments.applicationId,
        deadlineAt: membershipPaymentCampaigns.deadlineAt,
      })
      .from(membershipPayments)
      .innerJoin(
        membershipPaymentCampaigns,
        eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
      )
      .where(eq(membershipPayments.id, paymentId))
      .for("update", { of: membershipPayments })
      .limit(1);
    if (!payment) throw new MembershipPaymentError("Payment not found.", 404);
    if (payment.status !== "verified") {
      throw new MembershipPaymentError(
        "Only verified payments can be reversed.",
        409,
      );
    }
    assertDeadlineAllowsResubmission(payment.deadlineAt, new Date());
    const [submission] = await tx
      .select({ id: membershipPaymentSubmissions.id })
      .from(membershipPaymentSubmissions)
      .where(
        and(
          eq(membershipPaymentSubmissions.paymentId, paymentId),
          eq(membershipPaymentSubmissions.status, "verified"),
        ),
      )
      .orderBy(desc(membershipPaymentSubmissions.attemptNumber))
      .for("update")
      .limit(1);
    const reversedAt = new Date();
    if (submission) {
      await tx
        .update(membershipPaymentSubmissions)
        .set({ status: "reversed" })
        .where(eq(membershipPaymentSubmissions.id, submission.id));
    }
    await tx
      .update(membershipPayments)
      .set({
        status: "needs_resubmission",
        membershipStatus: "revoked",
        resubmissionDeadlineAt: null,
        reversedAt,
        reversedBy: actor.id,
        reversalReason: cleanReason,
        updatedAt: reversedAt,
      })
      .where(eq(membershipPayments.id, paymentId));
    return {
      paymentId,
      status: "needs_resubmission" as const,
      notificationId: await queueResubmissionEmail(tx, payment.applicationId),
    };
  });
}

export async function getPaymentReceiptUrl(
  paymentId: string,
  submissionId: string,
) {
  const [submission] = await db
    .select({
      url: membershipPaymentSubmissions.receiptUrl,
      key: membershipPaymentSubmissions.receiptKey,
      fileName: membershipPaymentSubmissions.receiptFileName,
    })
    .from(membershipPaymentSubmissions)
    .where(
      and(
        eq(membershipPaymentSubmissions.id, submissionId),
        eq(membershipPaymentSubmissions.paymentId, paymentId),
      ),
    )
    .limit(1);
  if (!submission) throw new MembershipPaymentError("Receipt not found.", 404);
  if (submission.url) return submission.url;
  if (!submission.key) throw new MembershipPaymentError("Receipt not found.", 404);
  return createPaymentReceiptDownload(
    submission.key,
    submission.fileName ?? "receipt",
  );
}

export async function listVerifiedMembersForExport() {
  const recruitmentYear = recruitmentYearInt();
  return db
    .select({
      memberId: applications.memberId,
      applicationCode: applications.applicationCode,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      email: applicants.email,
      birthday: applicants.birthday,
      gender: applicants.gender,
      section: applicants.section,
      facebookUrl: applicants.facebookUrl,
      applicationType: applications.applicationType,
      committee: committees.name,
      position: positions.name,
      officerTitle: officerSeats.title,
      verifiedAt: membershipPayments.verifiedAt,
    })
    .from(membershipPayments)
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(
      and(
        eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear),
        eq(membershipPayments.status, "verified"),
        eq(membershipPayments.membershipStatus, "active"),
        isNull(applications.archivedAt),
      ),
    )
    .orderBy(applicants.lastName, applicants.firstName);
}
