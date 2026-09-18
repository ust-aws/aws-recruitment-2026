import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  emailNotifications,
  positions,
} from "../../db/schema";
import { recruitmentYearInt } from "../applications/application-code";
import { deliverQueuedResultEmail } from "../email/service";
import { markFailed } from "../email/notifications";

export type ResultEmailDeliverySummary = {
  sent: number;
  failed: number;
};

export async function deliverResultNotifications(
  notificationIds: string[],
): Promise<ResultEmailDeliverySummary> {
  if (notificationIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const rows = await db
    .select({
      id: emailNotifications.id,
      messageType: emailNotifications.messageType,
      recipient: emailNotifications.recipient,
      lastName: applicants.lastName,
      position: positions.name,
      memberId: applications.memberId,
    })
    .from(emailNotifications)
    .innerJoin(
      applications,
      eq(emailNotifications.applicationId, applications.id),
    )
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .leftJoin(positions, eq(applications.finalPositionId, positions.id))
    .where(inArray(emailNotifications.id, notificationIds));

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      if (
        row.messageType !== "result_accepted" &&
        row.messageType !== "result_rejected"
      ) {
        await markFailed(row.id, "Notification is not a result email.");
        return "failed" as const;
      }
      if (row.messageType === "result_accepted" && !row.position) {
        await markFailed(row.id, "Accepted result has no final position.");
        return "failed" as const;
      }
      if (row.messageType === "result_accepted" && !row.memberId?.trim()) {
        await markFailed(row.id, "Accepted result has no membership ID.");
        return "failed" as const;
      }
      return deliverQueuedResultEmail({
        notificationId: row.id,
        messageType: row.messageType,
        recipient: row.recipient,
        lastName: row.lastName,
        position: row.position,
        memberId: row.memberId,
      });
    }),
  );
  const sent = results.filter(
    (result) => result.status === "fulfilled" && result.value === "sent",
  ).length;
  return { sent, failed: notificationIds.length - sent };
}

async function claimFailedResultNotifications(): Promise<string[]> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: emailNotifications.id })
      .from(emailNotifications)
      .innerJoin(
        applications,
        eq(emailNotifications.applicationId, applications.id),
      )
      .where(
        and(
          eq(emailNotifications.status, "failed"),
          inArray(emailNotifications.messageType, [
            "result_accepted",
            "result_rejected",
          ]),
          eq(applications.recruitmentYear, recruitmentYearInt()),
          isNotNull(applications.resultsReleasedAt),
        ),
      )
      .for("update");
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return [];

    await tx
      .update(emailNotifications)
      .set({ status: "pending", lastError: null })
      .where(inArray(emailNotifications.id, ids));
    return ids;
  });
}

export async function retryFailedResultEmails() {
  const notificationIds = await claimFailedResultNotifications();
  const delivery = await deliverResultNotifications(notificationIds);
  return {
    retried: notificationIds.length,
    ...delivery,
  };
}
