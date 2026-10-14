import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  committees,
  emailNotifications,
  membershipPaymentCampaigns,
  membershipPaymentChatLinks,
  membershipPayments,
  officerSeats,
} from "../../db/schema";
import type { AuthenticatedUser } from "../../auth";
import { recruitmentYearInt } from "../applications/application-code";
import { extendPaymentDeadline } from "./deadline-extension";
import { MembershipPaymentError } from "./errors";
import {
  createPaymentQrUpload,
  persistPaymentQr,
  type PaymentQrMimeType,
  type PaymentQrProvider,
} from "./payment-qr";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PaymentScheduleInput = {
  opensAt: Date;
  deadlineAt: Date;
  generalChatLink: string | null;
  /** Left unchanged when omitted. */
  coreTeamChatLink?: string | null;
  committeeChatLinks: { committeeId: string; chatLink: string }[];
};

export type PaymentDetailsInput = {
  amountCents: number;
  gcashAccountName: string | null;
  gcashAccountNumber: string | null;
  bpiAccountName: string | null;
  bpiAccountNumber: string | null;
};

export type PaymentQrInput = {
  provider: PaymentQrProvider;
  mimeType: PaymentQrMimeType;
  sizeBytes: number;
  checksumSha256: string;
};

export type CompletePaymentQrInput = PaymentQrInput & {
  key: string;
  fileName?: string;
};

function clean(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function validateSchedule(input: PaymentScheduleInput) {
  if (input.deadlineAt <= input.opensAt) {
    throw new MembershipPaymentError("Payment deadline must be after the opening date.");
  }
}

function validatePaymentDetails(input: PaymentDetailsInput) {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new MembershipPaymentError("Payment amount must be greater than zero.");
  }
}

export async function getCurrentPaymentCampaign() {
  const recruitmentYear = recruitmentYearInt();
  const [campaign] = await db
    .select()
    .from(membershipPaymentCampaigns)
    .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
    .limit(1);
  if (!campaign) return null;
  const links = await db
    .select({
      committeeId: membershipPaymentChatLinks.committeeId,
      chatLink: membershipPaymentChatLinks.chatLink,
    })
    .from(membershipPaymentChatLinks)
    .where(eq(membershipPaymentChatLinks.campaignId, campaign.id));
  return { ...campaign, committeeChatLinks: links };
}

export async function saveCurrentPaymentSchedule(
  input: PaymentScheduleInput,
) {
  validateSchedule(input);
  const recruitmentYear = recruitmentYearInt();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: membershipPaymentCampaigns.id,
        isOpen: membershipPaymentCampaigns.isOpen,
        deadlineAt: membershipPaymentCampaigns.deadlineAt,
      })
      .from(membershipPaymentCampaigns)
      .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
      .for("update")
      .limit(1);
    const values = {
      recruitmentYear,
      opensAt: input.opensAt,
      deadlineAt: input.deadlineAt,
      generalChatLink: clean(input.generalChatLink),
      ...(input.coreTeamChatLink === undefined
        ? {}
        : { coreTeamChatLink: clean(input.coreTeamChatLink) }),
      updatedAt: new Date(),
    };
    const [campaign] = existing
      ? await tx
          .update(membershipPaymentCampaigns)
          .set(values)
          .where(eq(membershipPaymentCampaigns.id, existing.id))
          .returning()
      : await tx.insert(membershipPaymentCampaigns).values(values).returning();

    await tx
      .delete(membershipPaymentChatLinks)
      .where(eq(membershipPaymentChatLinks.campaignId, campaign.id));
    const links = input.committeeChatLinks
      .map((link) => ({
        campaignId: campaign.id,
        committeeId: link.committeeId,
        chatLink: link.chatLink.trim(),
      }))
      .filter((link) => link.chatLink.length > 0);
    if (links.length > 0) {
      const committeeRows = await tx
        .select({ id: committees.id })
        .from(committees)
        .where(inArray(committees.id, links.map((link) => link.committeeId)));
      if (committeeRows.length !== links.length) {
        throw new MembershipPaymentError("One or more committees were not found.");
      }
      await tx.insert(membershipPaymentChatLinks).values(links);
    }

    // A deadline that moved later while payments are open is news to everyone who hasn't paid.
    const extended =
      existing?.isOpen === true &&
      input.deadlineAt > existing.deadlineAt &&
      input.deadlineAt > new Date();
    const extensionNotificationIds = extended
      ? await extendPaymentDeadline(tx, campaign.id, input.deadlineAt)
      : [];
    return { campaign: { ...campaign, committeeChatLinks: links }, extensionNotificationIds };
  });
}

export async function saveCurrentPaymentDetails(input: PaymentDetailsInput) {
  validatePaymentDetails(input);
  const recruitmentYear = recruitmentYearInt();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: membershipPaymentCampaigns.id,
        amountCents: membershipPaymentCampaigns.amountCents,
        gcashQrImageKey: membershipPaymentCampaigns.gcashQrImageKey,
        gcashQrImageUrl: membershipPaymentCampaigns.gcashQrImageUrl,
        gcashCoreQrImageKey: membershipPaymentCampaigns.gcashCoreQrImageKey,
        bpiQrImageKey: membershipPaymentCampaigns.bpiQrImageKey,
        bpiQrImageUrl: membershipPaymentCampaigns.bpiQrImageUrl,
      })
      .from(membershipPaymentCampaigns)
      .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
      .for("update")
      .limit(1);
    if (!existing) {
      throw new MembershipPaymentError(
        "HR must configure the payment period first.",
        409,
      );
    }
    if (
      !hasPaymentAccount({
        ...existing,
        gcashAccountNumber: clean(input.gcashAccountNumber),
        bpiAccountNumber: clean(input.bpiAccountNumber),
      })
    ) {
      throw new MembershipPaymentError(
        "Upload at least one official payment QR image.",
      );
    }
    if (existing.amountCents !== input.amountCents) {
      const [payment] = await tx
        .select({ id: membershipPayments.id })
        .from(membershipPayments)
        .where(eq(membershipPayments.campaignId, existing.id))
        .limit(1);
      if (payment) {
        throw new MembershipPaymentError(
          "Payment amount cannot change after the payment period has been opened.",
          409,
        );
      }
    }
    const [campaign] = await tx
      .update(membershipPaymentCampaigns)
      .set({
        amountCents: input.amountCents,
        gcashAccountName: clean(input.gcashAccountName),
        gcashAccountNumber: clean(input.gcashAccountNumber),
        bpiAccountName: clean(input.bpiAccountName),
        bpiAccountNumber: clean(input.bpiAccountNumber),
        updatedAt: new Date(),
      })
      .where(eq(membershipPaymentCampaigns.id, existing.id))
      .returning();
    const links = await tx
      .select({
        committeeId: membershipPaymentChatLinks.committeeId,
        chatLink: membershipPaymentChatLinks.chatLink,
      })
      .from(membershipPaymentChatLinks)
      .where(eq(membershipPaymentChatLinks.campaignId, campaign.id));
    return { ...campaign, committeeChatLinks: links };
  });
}

export async function createCurrentPaymentQrUpload(input: PaymentQrInput) {
  const campaign = await getCurrentPaymentCampaign();
  if (!campaign) {
    throw new MembershipPaymentError(
      "HR must configure the payment period first.",
      409,
    );
  }
  return createPaymentQrUpload({ campaignId: campaign.id, ...input });
}

export async function completeCurrentPaymentQrUpload(
  input: CompletePaymentQrInput,
) {
  const campaign = await getCurrentPaymentCampaign();
  if (!campaign) {
    throw new MembershipPaymentError(
      "HR must configure the payment period first.",
      409,
    );
  }
  const key = await persistPaymentQr({ campaignId: campaign.id, ...input });
  const fileName = clean(input.fileName ?? null);
  const values =
    input.provider === "gcash"
      ? { gcashQrImageKey: key, gcashQrFileName: fileName }
      : input.provider === "gcash_core"
        ? { gcashCoreQrImageKey: key, gcashCoreQrFileName: fileName }
        : { bpiQrImageKey: key, bpiQrFileName: fileName };
  const [updated] = await db
    .update(membershipPaymentCampaigns)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(membershipPaymentCampaigns.id, campaign.id))
    .returning();
  return { ...updated, committeeChatLinks: campaign.committeeChatLinks };
}

type PaymentAccountFields = {
  gcashAccountNumber: string | null;
  gcashQrImageKey: string | null;
  gcashQrImageUrl: string | null;
  gcashCoreQrImageKey: string | null;
  bpiAccountNumber: string | null;
  bpiQrImageKey: string | null;
  bpiQrImageUrl: string | null;
};

/** A payment method is usable once it has an account number or an uploaded QR. */
export function hasPaymentAccount(campaign: PaymentAccountFields) {
  return Boolean(
    campaign.gcashAccountNumber ||
      campaign.gcashQrImageKey ||
      campaign.gcashQrImageUrl ||
      campaign.gcashCoreQrImageKey ||
      campaign.bpiAccountNumber ||
      campaign.bpiQrImageKey ||
      campaign.bpiQrImageUrl,
  );
}

function hasPaymentDetails(
  campaign: PaymentAccountFields & { amountCents: number | null },
) {
  return Boolean(campaign.amountCents && hasPaymentAccount(campaign));
}

export async function openCurrentPaymentCampaign(actor: AuthenticatedUser) {
  const recruitmentYear = recruitmentYearInt();
  return db.transaction(async (tx) => {
    const [campaign] = await tx
      .select()
      .from(membershipPaymentCampaigns)
      .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
      .for("update")
      .limit(1);
    if (!campaign) {
      throw new MembershipPaymentError("Configure the payment period first.", 409);
    }
    if (!hasPaymentDetails(campaign)) {
      throw new MembershipPaymentError(
        "Set the amount and upload at least one official payment QR before opening payments.",
        409,
      );
    }
    const now = new Date();
    if (now < campaign.opensAt) {
      throw new MembershipPaymentError(
        "The configured payment opening date has not been reached.",
        409,
      );
    }
    if (now > campaign.deadlineAt) {
      throw new MembershipPaymentError(
        "Update the payment deadline before opening payments.",
        409,
      );
    }

    const eligible = await tx
      .select({ id: applications.id, applicationType: applications.applicationType })
      .from(applications)
      .where(
        and(
          eq(applications.recruitmentYear, recruitmentYear),
          isNull(applications.archivedAt),
          or(
            and(
              eq(applications.applicationType, "member"),
              eq(applications.status, "approved"),
            ),
            and(
              eq(applications.applicationType, "position"),
              isNotNull(applications.resultsReleasedAt),
              inArray(applications.status, ["approved", "rejected"]),
              or(
                isNull(applications.redirectPositionId),
                isNotNull(applications.redirectResponse),
              ),
            ),
            // The elected board and directors pay like members; advisers do not.
            and(
              eq(applications.applicationType, "officer"),
              inArray(
                applications.id,
                tx
                  .select({ id: officerSeats.applicationId })
                  .from(officerSeats)
                  .where(inArray(officerSeats.kind, ["eb", "director"])),
              ),
            ),
          ),
        ),
      );
    if (eligible.length === 0) {
      throw new MembershipPaymentError(
        "There are no eligible applicants for this payment period.",
        409,
      );
    }

    const { created, notificationIds } = await createPaymentsAndInvitations(
      tx,
      campaign.id,
      eligible.map((application) => application.id),
    );

    const openedAt = campaign.openedAt ?? now;
    await tx
      .update(membershipPaymentCampaigns)
      .set({ isOpen: true, openedAt, openedBy: actor.id, updatedAt: new Date() })
      .where(eq(membershipPaymentCampaigns.id, campaign.id));

    const officers = eligible.filter((application) => application.applicationType === "officer").length;
    return {
      campaignId: campaign.id,
      eligible: eligible.length,
      // Officers get their own version of the invitation; the rest are R101 applicants.
      officers,
      members: eligible.length - officers,
      created,
      notificationIds,
    };
  });
}

/**
 * Gives each application a payment row and, unless it already has one queued,
 * a payment invitation email. Safe to repeat for the same applications.
 */
async function createPaymentsAndInvitations(
  tx: Tx,
  campaignId: string,
  applicationIds: string[],
  options: { nextAttemptAt?: Date | null } = {},
) {
  const inserted = await tx
    .insert(membershipPayments)
    .values(applicationIds.map((applicationId) => ({ campaignId, applicationId })))
    .onConflictDoNothing({ target: membershipPayments.applicationId })
    .returning({ applicationId: membershipPayments.applicationId });

  const existingNotifications = await tx
    .select({ applicationId: emailNotifications.applicationId })
    .from(emailNotifications)
    .where(
      and(
        eq(emailNotifications.messageType, "payment_invitation"),
        inArray(emailNotifications.applicationId, applicationIds),
      ),
    );
  const alreadyQueued = new Set(
    existingNotifications.flatMap((row) => (row.applicationId ? [row.applicationId] : [])),
  );
  const toQueue = applicationIds.filter((id) => !alreadyQueued.has(id));
  const recipients =
    toQueue.length === 0
      ? []
      : await tx
          .select({ applicationId: applications.id, recipient: applicants.email })
          .from(applications)
          .innerJoin(applicants, eq(applications.applicantId, applicants.id))
          .where(inArray(applications.id, toQueue));
  const notifications =
    recipients.length === 0
      ? []
      : await tx
          .insert(emailNotifications)
          .values(
            recipients.map((row) => ({
              applicationId: row.applicationId,
              messageType: "payment_invitation" as const,
              recipient: row.recipient,
              nextAttemptAt: options.nextAttemptAt ?? null,
            })),
          )
          .returning({ id: emailNotifications.id });
  return { created: inserted.length, notificationIds: notifications.map((row) => row.id) };
}

/**
 * For someone who becomes eligible after payments opened (a newly elected
 * officer): invites them now, since "Open payments" has already run. Does
 * nothing while payments are closed; opening them will pick them up.
 */
export async function inviteToOpenCampaign(
  tx: Tx,
  applicationIds: string[],
  options: { nextAttemptAt?: Date | null } = {},
): Promise<string[]> {
  // Only this year's people join this year's campaign. A hunt winner for a later
  // term waits for that term's payments to open.
  const current = (
    await tx
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          inArray(applications.id, applicationIds),
          eq(applications.recruitmentYear, recruitmentYearInt()),
        ),
      )
  ).map((row) => row.id);
  if (current.length === 0) return [];
  const [campaign] = await tx
    .select({ id: membershipPaymentCampaigns.id, isOpen: membershipPaymentCampaigns.isOpen })
    .from(membershipPaymentCampaigns)
    .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYearInt()))
    .limit(1);
  if (!campaign?.isOpen) return [];
  return (await createPaymentsAndInvitations(tx, campaign.id, current, options)).notificationIds;
}

export async function closeCurrentPaymentCampaign() {
  const recruitmentYear = recruitmentYearInt();
  const [campaign] = await db
    .update(membershipPaymentCampaigns)
    .set({ isOpen: false, updatedAt: new Date() })
    .where(eq(membershipPaymentCampaigns.recruitmentYear, recruitmentYear))
    .returning();
  if (!campaign) throw new MembershipPaymentError("Payment period not found.", 404);
  return campaign;
}
