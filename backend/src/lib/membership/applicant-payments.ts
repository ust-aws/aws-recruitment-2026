import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "../../db";
import {
  applications,
  committees,
  membershipPaymentCampaigns,
  membershipPayments,
  membershipPaymentSubmissions,
  officerSeats,
  positions,
} from "../../db/schema";
import { healSavedExpiry } from "./deadline-extension";
import { MembershipPaymentError } from "./errors";
import { normalizeDriveReceiptUrl } from "./receipt-link";
import {
  createMemberPhotoDownload,
  createMemberPhotoUpload,
  MAX_MEMBER_PHOTO_SIZE_BYTES,
  persistMemberPhoto,
  type MemberPhotoMetadata,
} from "./member-photo";
import { isExecutiveOfficeCommittee } from "../apply/committee-office-groups";
import { memberPositionLabel } from "./member-position";
import { createPaymentQrDownload } from "./payment-qr";
import { loadResultGroupLinks } from "../applications/result-group-links";

export type SubmitPaymentInput = {
  method: "gcash" | "bpi";
  referenceNumber: string;
  receiptUrl: string;
};

function normalizeReferenceNumber(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function laterOf(date: Date, other: Date | null) {
  return other && other > date ? other : date;
}

function effectiveDeadline(row: {
  deadlineAt: Date;
  status: string;
  resubmissionDeadlineAt: Date | null;
  personalDeadlineAt: Date | null;
}) {
  const base =
    row.status === "needs_resubmission" && row.resubmissionDeadlineAt
      ? row.resubmissionDeadlineAt
      : row.deadlineAt;
  // HR may have quietly let this person pay later than everyone else.
  return laterOf(base, row.personalDeadlineAt);
}

function canSubmit(
  row: {
    isOpen: boolean;
    opensAt: Date;
    deadlineAt: Date;
    status: string;
    resubmissionDeadlineAt: Date | null;
    personalDeadlineAt: Date | null;
    archivedAt: Date | null;
  },
  now = new Date(),
) {
  // A personal deadline lets them pay even after HR closes the period for everyone else.
  const open = row.isOpen || (row.personalDeadlineAt !== null && now <= row.personalDeadlineAt);
  return (
    open &&
    !row.archivedAt &&
    now >= row.opensAt &&
    now <= effectiveDeadline(row) &&
    (row.status === "awaiting_payment" || row.status === "needs_resubmission")
  );
}

async function loadApplicantPayment(applicationId: string) {
  const [row] = await db
    .select({
      paymentId: membershipPayments.id,
      campaignId: membershipPaymentCampaigns.id,
      applicationId: applications.id,
      applicationCode: applications.applicationCode,
      applicationType: applications.applicationType,
      applicationStatus: applications.status,
      archivedAt: applications.archivedAt,
      memberId: applications.memberId,
      memberPhotoKey: applications.memberPhotoKey,
      verifiedAt: membershipPayments.verifiedAt,
      recruitmentYear: applications.recruitmentYear,
      positionName: positions.name,
      committeeId: committees.id,
      committeeName: committees.name,
      officerTitle: officerSeats.title,
      officerKind: officerSeats.kind,
      generalChatLink: membershipPaymentCampaigns.generalChatLink,
      coreTeamChatLink: membershipPaymentCampaigns.coreTeamChatLink,
      paymentStatus: membershipPayments.status,
      membershipStatus: membershipPayments.membershipStatus,
      resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt,
      personalDeadlineAt: membershipPayments.personalDeadlineAt,
      amountCents: membershipPaymentCampaigns.amountCents,
      opensAt: membershipPaymentCampaigns.opensAt,
      deadlineAt: membershipPaymentCampaigns.deadlineAt,
      isOpen: membershipPaymentCampaigns.isOpen,
      gcashAccountName: membershipPaymentCampaigns.gcashAccountName,
      gcashAccountNumber: membershipPaymentCampaigns.gcashAccountNumber,
      gcashQrImageUrl: membershipPaymentCampaigns.gcashQrImageUrl,
      gcashQrImageKey: membershipPaymentCampaigns.gcashQrImageKey,
      gcashCoreQrImageKey: membershipPaymentCampaigns.gcashCoreQrImageKey,
      bpiAccountName: membershipPaymentCampaigns.bpiAccountName,
      bpiAccountNumber: membershipPaymentCampaigns.bpiAccountNumber,
      bpiQrImageUrl: membershipPaymentCampaigns.bpiQrImageUrl,
      bpiQrImageKey: membershipPaymentCampaigns.bpiQrImageKey,
    })
    .from(membershipPayments)
    .innerJoin(
      membershipPaymentCampaigns,
      eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
    )
    .innerJoin(applications, eq(membershipPayments.applicationId, applications.id))
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .leftJoin(committees, eq(positions.committeeId, committees.id))
    .leftJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(eq(membershipPayments.applicationId, applicationId))
    .limit(1);
  if (!row) return null;
  const amountCents = row.amountCents;
  if (amountCents === null) {
    throw new MembershipPaymentError(
      "Payment amount is not configured.",
      409,
    );
  }

  // Saved as expired by older code but payments are open again: let them pay.
  if (row.paymentStatus === "expired" && row.isOpen && new Date() <= row.deadlineAt) {
    await healSavedExpiry(row.campaignId);
    const [healed] = await db
      .select({
        status: membershipPayments.status,
        resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt,
      })
      .from(membershipPayments)
      .where(eq(membershipPayments.id, row.paymentId));
    row.paymentStatus = healed.status;
    row.resubmissionDeadlineAt = healed.resubmissionDeadlineAt;
  }

  const deadline = effectiveDeadline({
    personalDeadlineAt: row.personalDeadlineAt,
    deadlineAt: row.deadlineAt,
    status: row.paymentStatus,
    resubmissionDeadlineAt: row.resubmissionDeadlineAt,
  });
  // Shown as expired, never saved as expired: a saved status got stuck when payments reopened.
  if (
    (row.paymentStatus === "awaiting_payment" ||
      row.paymentStatus === "needs_resubmission") &&
    new Date() > deadline
  ) {
    row.paymentStatus = "expired";
  }

  const [latestSubmission] = await db
    .select({
      id: membershipPaymentSubmissions.id,
      attemptNumber: membershipPaymentSubmissions.attemptNumber,
      method: membershipPaymentSubmissions.method,
      referenceNumber: membershipPaymentSubmissions.referenceNumber,
      status: membershipPaymentSubmissions.status,
      submittedAt: membershipPaymentSubmissions.submittedAt,
      reviewedAt: membershipPaymentSubmissions.reviewedAt,
      reviewReason: membershipPaymentSubmissions.reviewReason,
    })
    .from(membershipPaymentSubmissions)
    .where(eq(membershipPaymentSubmissions.paymentId, row.paymentId))
    .orderBy(desc(membershipPaymentSubmissions.attemptNumber))
    .limit(1);
  return { ...row, amountCents, latestSubmission: latestSubmission ?? null };
}

async function buildMemberCard(input: {
  memberId: string;
  recruitmentYear: number;
  issuedAt: Date | null;
  position: string;
  photoKey: string | null;
}) {
  return {
    memberId: input.memberId,
    recruitmentYear: input.recruitmentYear,
    issuedAt: input.issuedAt?.toISOString() ?? null,
    position: input.position,
    photoUrl: input.photoKey ? await createMemberPhotoDownload(input.photoKey) : null,
  };
}

/**
 * Advisers hold an active Member ID without paying, so they have no payment row.
 * They get the same shape as a verified member, with the card and nothing to pay.
 */
async function getAdviserCard(applicationId: string) {
  const [row] = await db
    .select({
      applicationCode: applications.applicationCode,
      applicationStatus: applications.status,
      archivedAt: applications.archivedAt,
      memberId: applications.memberId,
      memberPhotoKey: applications.memberPhotoKey,
      recruitmentYear: applications.recruitmentYear,
      issuedAt: applications.submittedAt,
      officerTitle: officerSeats.title,
    })
    .from(applications)
    .innerJoin(officerSeats, eq(officerSeats.applicationId, applications.id))
    .where(and(eq(applications.id, applicationId), eq(officerSeats.kind, "adviser")))
    .limit(1);
  if (!row?.memberId || row.archivedAt) return null;
  const issuedAt = row.issuedAt.toISOString();
  return {
    applicationCode: row.applicationCode,
    applicationType: "officer" as const,
    applicationStatus: row.applicationStatus,
    paymentStatus: "verified" as const,
    membershipStatus: "active" as const,
    amountCents: 0,
    opensAt: issuedAt,
    deadlineAt: issuedAt,
    resubmissionDeadlineAt: null,
    paymentMethods: { gcash: null, bpi: null },
    canSubmit: false,
    latestSubmission: null,
    memberCard: await buildMemberCard({
      memberId: row.memberId,
      recruitmentYear: row.recruitmentYear,
      issuedAt: row.issuedAt,
      position: memberPositionLabel({
        applicationType: "officer",
        applicationStatus: row.applicationStatus,
        positionName: null,
        committeeName: null,
        officerTitle: row.officerTitle,
      }),
      photoKey: row.memberPhotoKey,
    }),
    memberId: row.memberId,
    membersGroupLink: null,
    committeeChatLink: null,
    committeeName: null,
    coreTeamChatLink: null,
  };
}

export async function getApplicantPayment(applicationId: string) {
  const row = await loadApplicantPayment(applicationId);
  if (!row) return getAdviserCard(applicationId);
  // The Member ID and the group links open up the moment the payment is verified.
  const verified =
    row.paymentStatus === "verified" && row.membershipStatus === "active";
  // Advisers do not join the member group chats or Facebook groups.
  const joinsGroups = verified && row.officerKind !== "adviser";
  const acceptedIntoCommittee =
    row.applicationType === "position" &&
    row.applicationStatus === "approved" &&
    Boolean(row.positionName);
  // Anyone accepted into a committee (EAs and staff, including accepted
  // redirects) pays through the CFO's QR. General members (member-only,
  // rejected, and redirected applicants who declined or haven't answered) use
  // the Director for Finance's. Fall back to that one if the CFO's is missing.
  const gcashQrKey =
    (acceptedIntoCommittee || row.applicationType === "officer") &&
    row.gcashCoreQrImageKey
      ? row.gcashCoreQrImageKey
      : row.gcashQrImageKey;
  const [gcashQrImageUrl, bpiQrImageUrl] = await Promise.all([
    gcashQrKey ? createPaymentQrDownload(gcashQrKey) : row.gcashQrImageUrl,
    row.bpiQrImageKey
      ? createPaymentQrDownload(row.bpiQrImageKey)
      : row.bpiQrImageUrl,
  ]);
  const committeeLinks =
    joinsGroups && acceptedIntoCommittee && row.committeeId && row.committeeName
      ? await loadResultGroupLinks(row.recruitmentYear, {
          id: row.committeeId,
          name: row.committeeName,
        })
      : null;
  const memberCard =
    row.paymentStatus === "verified" &&
    row.membershipStatus === "active" &&
    row.memberId
      ? await buildMemberCard({
          memberId: row.memberId,
          recruitmentYear: row.recruitmentYear,
          issuedAt: row.verifiedAt,
          position: memberPositionLabel(row),
          photoKey: row.memberPhotoKey,
        })
      : null;
  return {
    applicationCode: row.applicationCode,
    applicationType: row.applicationType,
    applicationStatus: row.applicationStatus,
    paymentStatus: row.paymentStatus,
    membershipStatus: row.membershipStatus,
    amountCents: row.amountCents,
    opensAt: row.opensAt.toISOString(),
    // Their own deadline when HR let them pay late.
    deadlineAt: laterOf(row.deadlineAt, row.personalDeadlineAt).toISOString(),
    resubmissionDeadlineAt: row.resubmissionDeadlineAt
      ? laterOf(row.resubmissionDeadlineAt, row.personalDeadlineAt).toISOString()
      : null,
    paymentMethods: {
      gcash: row.gcashAccountNumber || gcashQrImageUrl
        ? {
            accountName: row.gcashAccountName,
            accountNumber: row.gcashAccountNumber,
            qrImageUrl: gcashQrImageUrl,
          }
        : null,
      bpi: row.bpiAccountNumber || bpiQrImageUrl
        ? {
            accountName: row.bpiAccountName,
            accountNumber: row.bpiAccountNumber,
            qrImageUrl: bpiQrImageUrl,
          }
        : null,
    },
    canSubmit: canSubmit({
      isOpen: row.isOpen,
      opensAt: row.opensAt,
      deadlineAt: row.deadlineAt,
      status: row.paymentStatus,
      resubmissionDeadlineAt: row.resubmissionDeadlineAt,
      personalDeadlineAt: row.personalDeadlineAt,
      archivedAt: row.archivedAt,
    }),
    latestSubmission: row.latestSubmission
      ? {
          ...row.latestSubmission,
          submittedAt: row.latestSubmission.submittedAt.toISOString(),
          reviewedAt: row.latestSubmission.reviewedAt?.toISOString() ?? null,
        }
      : null,
    memberCard,
    memberId: verified ? row.memberId : null,
    membersGroupLink: joinsGroups ? row.generalChatLink : null,
    committeeChatLink: committeeLinks?.committeeChatLink ?? null,
    committeeName: committeeLinks?.committeeName ?? null,
    coreTeamChatLink:
      joinsGroups &&
      (row.officerKind === "eb" ||
        row.officerKind === "director" ||
        row.officerKind === "ea" ||
        (acceptedIntoCommittee &&
          row.committeeName &&
          isExecutiveOfficeCommittee(row.committeeName)))
        ? row.coreTeamChatLink
        : null,
  };
}

export async function submitApplicantPayment(
  applicationId: string,
  input: SubmitPaymentInput,
) {
  const receiptUrl = normalizeDriveReceiptUrl(input.receiptUrl);
  const referenceNumber = input.referenceNumber.trim();
  const referenceNumberNormalized = normalizeReferenceNumber(referenceNumber);
  if (referenceNumberNormalized.length < 4) {
    throw new MembershipPaymentError("Enter a valid payment reference number.");
  }

  const payment = await loadApplicantPayment(applicationId);
  if (!payment) {
    throw new MembershipPaymentError("Payment invitation not found.", 404);
  }
  if (
    input.method === "gcash" &&
    !payment.gcashAccountNumber &&
    !payment.gcashQrImageKey &&
    !payment.gcashCoreQrImageKey &&
    !payment.gcashQrImageUrl
  ) {
    throw new MembershipPaymentError("GCash is not available for this payment period.");
  }
  if (
    input.method === "bpi" &&
    !payment.bpiAccountNumber &&
    !payment.bpiQrImageKey &&
    !payment.bpiQrImageUrl
  ) {
    throw new MembershipPaymentError("BPI is not available for this payment period.");
  }
  if (
    !canSubmit({
      isOpen: payment.isOpen,
      opensAt: payment.opensAt,
      deadlineAt: payment.deadlineAt,
      status: payment.paymentStatus,
      resubmissionDeadlineAt: payment.resubmissionDeadlineAt,
      personalDeadlineAt: payment.personalDeadlineAt,
      archivedAt: payment.archivedAt,
    })
  ) {
    throw new MembershipPaymentError("Payment submission is not available.", 409);
  }

  const [duplicate] = await db
    .select({ id: membershipPaymentSubmissions.id })
    .from(membershipPaymentSubmissions)
    .where(
      and(
        eq(membershipPaymentSubmissions.campaignId, payment.campaignId),
        eq(
          membershipPaymentSubmissions.referenceNumberNormalized,
          referenceNumberNormalized,
        ),
        // The applicant's own earlier (rejected) attempts may reuse the reference.
        ne(membershipPaymentSubmissions.paymentId, payment.paymentId),
      ),
    )
    .limit(1);
  if (duplicate) {
    throw new MembershipPaymentError(
      "This payment reference number has already been submitted.",
      409,
    );
  }

  try {
    return await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({
          id: membershipPayments.id,
          status: membershipPayments.status,
          resubmissionDeadlineAt: membershipPayments.resubmissionDeadlineAt,
          personalDeadlineAt: membershipPayments.personalDeadlineAt,
          isOpen: membershipPaymentCampaigns.isOpen,
          opensAt: membershipPaymentCampaigns.opensAt,
          deadlineAt: membershipPaymentCampaigns.deadlineAt,
          archivedAt: applications.archivedAt,
        })
        .from(membershipPayments)
        .innerJoin(
          membershipPaymentCampaigns,
          eq(membershipPayments.campaignId, membershipPaymentCampaigns.id),
        )
        .innerJoin(
          applications,
          eq(membershipPayments.applicationId, applications.id),
        )
        .where(
          and(
            eq(membershipPayments.id, payment.paymentId),
            eq(membershipPayments.applicationId, applicationId),
          ),
        )
        .for("update", { of: membershipPayments })
        .limit(1);
      if (!locked || !canSubmit(locked)) {
        throw new MembershipPaymentError(
          "Payment submission is no longer available.",
          409,
        );
      }
      const [latest] = await tx
        .select({ attemptNumber: membershipPaymentSubmissions.attemptNumber })
        .from(membershipPaymentSubmissions)
        .where(eq(membershipPaymentSubmissions.paymentId, locked.id))
        .orderBy(desc(membershipPaymentSubmissions.attemptNumber))
        .limit(1);
      const [submission] = await tx
        .insert(membershipPaymentSubmissions)
        .values({
          paymentId: locked.id,
          campaignId: payment.campaignId,
          attemptNumber: (latest?.attemptNumber ?? 0) + 1,
          method: input.method,
          referenceNumber,
          referenceNumberNormalized,
          amountCents: payment.amountCents,
          receiptUrl,
        })
        .returning({
          id: membershipPaymentSubmissions.id,
          attemptNumber: membershipPaymentSubmissions.attemptNumber,
          submittedAt: membershipPaymentSubmissions.submittedAt,
        });
      await tx
        .update(membershipPayments)
        .set({
          status: "pending_verification",
          resubmissionDeadlineAt: null,
          updatedAt: new Date(),
        })
        .where(eq(membershipPayments.id, locked.id));
      return {
        ...submission,
        status: "pending_verification" as const,
        submittedAt: submission.submittedAt.toISOString(),
      };
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new MembershipPaymentError(
        "This payment reference number has already been submitted.",
        409,
      );
    }
    throw error;
  }
}

export async function createApplicantMemberPhotoUpload(
  applicationId: string,
  input: MemberPhotoMetadata,
) {
  await requireMemberCard(applicationId);
  if (input.sizeBytes > MAX_MEMBER_PHOTO_SIZE_BYTES) {
    throw new MembershipPaymentError("Photo must be 5 MB or smaller.");
  }
  return createMemberPhotoUpload(applicationId, input);
}

export async function completeApplicantMemberPhoto(
  applicationId: string,
  input: MemberPhotoMetadata & { key: string },
) {
  await requireMemberCard(applicationId);
  const key = await persistMemberPhoto(applicationId, input);
  await db
    .update(applications)
    .set({ memberPhotoKey: key, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));
  const payment = await getApplicantPayment(applicationId);
  return { memberCard: payment?.memberCard ?? null };
}

async function requireMemberCard(applicationId: string) {
  const payment = await getApplicantPayment(applicationId);
  if (!payment?.memberCard) {
    throw new MembershipPaymentError(
      "Your member ID is not available yet.",
      409,
    );
  }
}
