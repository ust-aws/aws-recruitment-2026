import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import { applications, emailNotifications, users } from "../../db/schema";
import { allocateMemberIds } from "../core/member-id";
import { getResultsPreviewForUpdate } from "./results-preview";

export type ResultsReleaseSummary = {
  released: number;
  accepted: number;
  rejected: number;
  memberIdsGenerated: number;
  releasedAt: string | null;
};

export type ResultsRelease = {
  summary: ResultsReleaseSummary;
  notificationIds: string[];
};

export class ResultsReleaseBlockedError extends Error {
  readonly incomplete: number;

  constructor(incomplete: number) {
    super("Results cannot be released while applications are incomplete.");
    this.name = "ResultsReleaseBlockedError";
    this.incomplete = incomplete;
  }
}

export async function releaseResults(
  reviewerEmail?: string,
): Promise<ResultsRelease> {
  return db.transaction(async (tx) => {
    const preview = await getResultsPreviewForUpdate(tx);
    if (preview.summary.pendingRelease === 0) {
      return {
        summary: {
          released: 0,
          accepted: 0,
          rejected: 0,
          memberIdsGenerated: 0,
          releasedAt: null,
        },
        notificationIds: [],
      };
    }
    if (!preview.summary.canRelease) {
      throw new ResultsReleaseBlockedError(preview.summary.incomplete);
    }

    const memberRows = await tx
      .select({ id: applications.id, memberId: applications.memberId })
      .from(applications)
      .where(eq(applications.recruitmentYear, preview.recruitmentYear));
    const memberIdByApplication = new Map(
      memberRows.map((row) => [row.id, row.memberId]),
    );
    let nextMemberId = 0;
    let memberIdsGenerated = 0;
    const releasedAt = new Date();
    const notificationIds: string[] = [];
    let reviewerId: string | null = null;
    if (reviewerEmail) {
      const [reviewer] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, reviewerEmail.trim().toLowerCase()))
        .limit(1);
      reviewerId = reviewer?.id ?? null;
    }

    const applicationsToRelease = [...preview.applications].sort((a, b) =>
      a.submittedAt.localeCompare(b.submittedAt),
    );
    const memberIds = await allocateMemberIds(
      tx,
      preview.recruitmentYear,
      applicationsToRelease.filter(
        (application) =>
          application.classification === "accepted" &&
          !memberIdByApplication.get(application.id),
      ).length,
    );
    for (const application of applicationsToRelease) {
      const accepted = application.classification === "accepted";
      let memberId = memberIdByApplication.get(application.id) ?? null;
      if (accepted && !memberId) {
        memberId = memberIds[nextMemberId];
        nextMemberId += 1;
        memberIdsGenerated += 1;
      }

      await tx
        .update(applications)
        .set({
          status: accepted ? "approved" : "rejected",
          memberId: accepted ? memberId : null,
          resultsReleasedAt: releasedAt,
          resultsReleasedBy: reviewerId,
        })
        .where(
          and(
            eq(applications.id, application.id),
            isNull(applications.resultsReleasedAt),
          ),
        );

      const [notification] = await tx
        .insert(emailNotifications)
        .values({
          applicationId: application.id,
          messageType: accepted ? "result_accepted" : "result_rejected",
          recipient: application.applicant.email,
        })
        .returning({ id: emailNotifications.id });
      notificationIds.push(notification.id);
    }

    return {
      summary: {
        released: applicationsToRelease.length,
        accepted: preview.summary.accepted,
        rejected: preview.summary.rejected,
        memberIdsGenerated,
        releasedAt: releasedAt.toISOString(),
      },
      notificationIds,
    };
  });
}
