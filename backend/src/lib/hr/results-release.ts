import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import { applications, emailNotifications, users } from "../../db/schema";
import type { RecruitmentTrack } from "../applications/recruitment-scope";
import { seatHuntWinner } from "../officer-hunt/seats";
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
  /** Officer-hunt winners seated by this release. */
  seated: number;
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
  track: RecruitmentTrack = "r101",
): Promise<ResultsRelease> {
  return db.transaction(async (tx) => {
    const preview = await getResultsPreviewForUpdate(tx, track);
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
        seated: 0,
      };
    }
    if (!preview.summary.canRelease) {
      throw new ResultsReleaseBlockedError(preview.summary.incomplete);
    }

    const releasedAt = new Date();
    const notificationIds: string[] = [];
    let seated = 0;
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
    for (const application of applicationsToRelease) {
      const redirected = application.classification === "redirected";
      const accepted =
        !redirected && application.classification === "accepted";

      await tx
        .update(applications)
        .set({
          status: redirected || accepted ? "approved" : "rejected",
          resultsReleasedAt: releasedAt,
          resultsReleasedBy: reviewerId,
        })
        .where(
          and(
            eq(applications.id, application.id),
            isNull(applications.resultsReleasedAt),
          ),
        );

      if (!application.willSendEmail) continue;

      // A hunt winner becomes an officer on the spot: a seat, a welcome and, if
      // payments are already open, their payment invitation.
      if (track === "officer_hunt" && accepted) {
        const queued = await seatHuntWinner(tx, application.id);
        if (queued) {
          seated += 1;
          notificationIds.push(...queued);
          continue;
        }
      }

      const messageType = redirected
        ? "result_redirected"
        : accepted
          ? "result_accepted"
          : "result_rejected";

      const [notification] = await tx
        .insert(emailNotifications)
        .values({
          applicationId: application.id,
          messageType,
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
        memberIdsGenerated: 0,
        releasedAt: releasedAt.toISOString(),
      },
      notificationIds,
      seated,
    };
  });
}
