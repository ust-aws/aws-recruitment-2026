import { Hono } from "hono";
import { z } from "zod";
import { getCurrentUser, requireRoles } from "../auth";
import {
  closeCurrentPaymentCampaign,
  completeCurrentPaymentQrUpload,
  createCurrentPaymentQrUpload,
  getCurrentPaymentCampaign,
  openCurrentPaymentCampaign,
  saveCurrentPaymentDetails,
  saveCurrentPaymentSchedule,
} from "../lib/membership/campaigns";
import {
  MAX_PAYMENT_QR_SIZE_BYTES,
  PAYMENT_QR_MIME_TYPES,
  withQrPreviewUrls,
} from "../lib/membership/payment-qr";
import { kickEmailOutbox } from "../lib/email/outbox-kick";
import { sendQueuedNow } from "../lib/email/queued-emails";
import {
  markPaymentInvitationsDelivered,
  retryFailedMembershipEmails,
  sendPaymentInvitations,
} from "../lib/membership/email-delivery";
import { MembershipPaymentError } from "../lib/membership/errors";
import { listDirectoryMembers, listPendingOfficers } from "../lib/membership/member-directory";
import {
  getMembershipPaymentDetails,
  getPaymentReceiptUrl,
  listMembershipPayments,
  listVerifiedMembersForExport,
  rejectMembershipPayment,
  reverseMembershipPayment,
  verifyMembershipPayment,
} from "../lib/membership/reviews";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nullableAccountName = z.string().trim().max(150).nullable();
const nullableAccountNumber = z.string().trim().max(50).nullable();
const httpUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"))
const nullableUrl = httpUrl.nullable();
const scheduleSchema = z.object({
  opensAt: z.string().datetime({ offset: true }),
  deadlineAt: z.string().datetime({ offset: true }),
  generalChatLink: nullableUrl,
  coreTeamChatLink: nullableUrl.optional(),
  committeeChatLinks: z.array(
    z.object({
      committeeId: z.string().uuid(),
      chatLink: httpUrl,
    }),
  ).refine(
    (links) => new Set(links.map((link) => link.committeeId)).size === links.length,
    "Each committee may only have one group-chat link.",
  ),
});
const paymentDetailsSchema = z.object({
  amountCents: z.number().int().positive(),
  gcashAccountName: nullableAccountName,
  gcashAccountNumber: nullableAccountNumber,
  bpiAccountName: nullableAccountName,
  bpiAccountNumber: nullableAccountNumber,
});
const paymentQrSchema = z.object({
  provider: z.enum(["gcash", "gcash_core", "bpi"]),
  mimeType: z.enum(PAYMENT_QR_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_PAYMENT_QR_SIZE_BYTES),
  checksumSha256: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
});
const completePaymentQrSchema = paymentQrSchema.extend({
  key: z.string().trim().min(1).max(500),
  fileName: z.string().trim().max(255).optional(),
});
const paymentSelectionSchema = z.object({ paymentIds: z.array(z.uuid()).min(1).max(500) });
const reviewSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

function paymentError(error: unknown) {
  if (!(error instanceof MembershipPaymentError)) throw error;
  return { body: { error: error.message }, status: error.status } as const;
}

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const membershipPaymentRoutes = new Hono();

membershipPaymentRoutes.use("*", requireRoles("hr", "admin"));

membershipPaymentRoutes.get("/campaign", async (c) => {
  const campaign = await getCurrentPaymentCampaign();
  return c.json({
    campaign: campaign ? await withQrPreviewUrls(campaign) : null,
  });
});

membershipPaymentRoutes.put(
  "/campaign/schedule",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = scheduleSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) {
      return c.json(
        { error: "Enter valid payment-period dates and links." },
        400,
      );
    }
    try {
      const saved = await saveCurrentPaymentSchedule({
        ...parsed.data,
        opensAt: new Date(parsed.data.opensAt),
        deadlineAt: new Date(parsed.data.deadlineAt),
      });
      // "Deadline extended" emails go out through the background email outbox.
      if (saved.extensionNotificationIds.length > 0) await kickEmailOutbox();
      return c.json({
        ...(await withQrPreviewUrls(saved.campaign)),
        extensionEmails: { queued: saved.extensionNotificationIds.length },
      });
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.put(
  "/campaign/payment-details",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = paymentDetailsSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) {
      return c.json({ error: "Enter valid payment amount and account details." }, 400);
    }
    try {
      return c.json(
        await withQrPreviewUrls(await saveCurrentPaymentDetails(parsed.data)),
      );
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/campaign/payment-qr/presign",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = paymentQrSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) {
      return c.json({ error: "Choose a valid QR image up to 5 MB." }, 400);
    }
    try {
      return c.json(await createCurrentPaymentQrUpload(parsed.data), 201);
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/campaign/payment-qr/complete",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = completePaymentQrSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) {
      return c.json({ error: "Enter valid uploaded QR image details." }, 400);
    }
    try {
      return c.json(
        await withQrPreviewUrls(
          await completeCurrentPaymentQrUpload(parsed.data),
        ),
      );
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/campaign/open",
  requireRoles("hr", "admin"),
  async (c) => {
    try {
      const opened = await openCurrentPaymentCampaign(getCurrentUser(c));
      // Invitations go out through the background email outbox.
      if (opened.notificationIds.length > 0) await kickEmailOutbox();
      return c.json({
        eligible: opened.eligible,
        officers: opened.officers,
        members: opened.members,
        created: opened.created,
        emailDelivery: { queued: opened.notificationIds.length },
      });
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/campaign/close",
  requireRoles("hr", "admin"),
  async (c) => {
    try {
      return c.json(await closeCurrentPaymentCampaign());
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/emails/retry-invitations",
  requireRoles("hr", "admin"),
  async (c) => {
    const result = await retryFailedMembershipEmails("payment_invitation");
    if (result.retried > 0) await kickEmailOutbox();
    return c.json(result);
  },
);

/** Verified members of the current year, for the HR Members page. */
/** Sends (or resends) the payment email to the people HR ticked. */
membershipPaymentRoutes.post(
  "/emails/send-invitations",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = paymentSelectionSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Pick at least one person." }, 400);
    try {
      const result = await sendPaymentInvitations(parsed.data.paymentIds);
      // Start the sender for already-waiting emails too: it only runs when started.
      if (result.queued > 0 || result.alreadyWaiting > 0) await kickEmailOutbox();
      return c.json(result);
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

/** Counts the ticked people's uncertain payment emails as sent; HR found them in the Sent folder. */
membershipPaymentRoutes.post(
  "/emails/mark-delivered",
  requireRoles("hr", "admin"),
  async (c) => {
    const parsed = paymentSelectionSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Pick at least one person." }, 400);
    return c.json(await markPaymentInvitationsDelivered(parsed.data.paymentIds));
  },
);

membershipPaymentRoutes.get("/members", async (c) => {
  const members = await listDirectoryMembers();
  const pendingOfficers = await listPendingOfficers(
    new Set(members.map((member) => member.memberId)),
  );
  return c.json({ members, pendingOfficers });
});

membershipPaymentRoutes.get("/export", async (c) => {
  const rows = await listVerifiedMembersForExport();
  const header = [
    "Member ID",
    "Application ID",
    "First Name",
    "Last Name",
    "Email",
    "Applicant Type",
    "Committee",
    "Position",
    "Verified At",
  ];
  const csv = [
    header,
    ...rows.map((row) => [
      row.memberId,
      row.applicationCode,
      row.firstName,
      row.lastName,
      row.email,
      row.applicationType === "member"
        ? "General Member"
        : row.applicationType === "officer"
          ? "Officer"
          : "Committee",
      row.committee,
      row.position ?? row.officerTitle,
      row.verifiedAt?.toISOString() ?? "",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header(
    "Content-Disposition",
    `attachment; filename="verified-members-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  return c.body(`\uFEFF${csv}`);
});

membershipPaymentRoutes.get("/", async (c) => {
  return c.json(await listMembershipPayments());
});

membershipPaymentRoutes.get("/:paymentId", async (c) => {
  const paymentId = c.req.param("paymentId");
  if (!UUID_RE.test(paymentId)) return c.json({ error: "Invalid payment id." }, 400);
  try {
    return c.json(await getMembershipPaymentDetails(paymentId));
  } catch (error) {
    const result = paymentError(error);
    return c.json(result.body, result.status);
  }
});

membershipPaymentRoutes.get("/:paymentId/receipts/:submissionId", async (c) => {
  const paymentId = c.req.param("paymentId");
  const submissionId = c.req.param("submissionId");
  if (!UUID_RE.test(paymentId) || !UUID_RE.test(submissionId)) {
    return c.json({ error: "Invalid receipt id." }, 400);
  }
  try {
    return c.json({ url: await getPaymentReceiptUrl(paymentId, submissionId) });
  } catch (error) {
    const result = paymentError(error);
    return c.json(result.body, result.status);
  }
});

membershipPaymentRoutes.post(
  "/:paymentId/verify",
  requireRoles("hr", "admin"),
  async (c) => {
    const paymentId = c.req.param("paymentId");
    if (!UUID_RE.test(paymentId)) return c.json({ error: "Invalid payment id." }, 400);
    try {
      const { notificationId, ...verified } = await verifyMembershipPayment(
        paymentId,
        getCurrentUser(c),
      );
      const emailDelivery = await sendQueuedNow([notificationId]);
      if (emailDelivery.queued > 0) await kickEmailOutbox();
      return c.json({ ...verified, emailDelivery });
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/:paymentId/reject",
  requireRoles("hr", "admin"),
  async (c) => {
    const paymentId = c.req.param("paymentId");
    if (!UUID_RE.test(paymentId)) return c.json({ error: "Invalid payment id." }, 400);
    const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "A rejection reason is required." }, 400);
    try {
      const { notificationId, ...rejected } = await rejectMembershipPayment(
        paymentId,
        getCurrentUser(c),
        parsed.data.reason,
      );
      // Tell them what to fix; if Gmail asks to slow down, the background sender finishes the job.
      const emailDelivery = await sendQueuedNow([notificationId]);
      if (emailDelivery.queued > 0) await kickEmailOutbox();
      return c.json({ ...rejected, emailDelivery });
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);

membershipPaymentRoutes.post(
  "/:paymentId/reverse",
  requireRoles("hr", "admin"),
  async (c) => {
    const paymentId = c.req.param("paymentId");
    if (!UUID_RE.test(paymentId)) return c.json({ error: "Invalid payment id." }, 400);
    const parsed = reviewSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "A reversal reason is required." }, 400);
    try {
      const { notificationId, ...reversed } = await reverseMembershipPayment(
        paymentId,
        getCurrentUser(c),
        parsed.data.reason,
      );
      const emailDelivery = await sendQueuedNow([notificationId]);
      if (emailDelivery.queued > 0) await kickEmailOutbox();
      return c.json({ ...reversed, emailDelivery });
    } catch (error) {
      const result = paymentError(error);
      return c.json(result.body, result.status);
    }
  },
);
