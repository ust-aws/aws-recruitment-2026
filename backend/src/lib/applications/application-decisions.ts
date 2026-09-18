import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  applicationChoices,
  applications,
  users,
} from "../../db/schema";
import { getApplicationById } from "./applications";

export type ChoiceDecisionStatus = "approved" | "rejected";

export type UpdateApplicationDecisionInput = {
  positionId?: string;
  decisionStatus?: ChoiceDecisionStatus;
  finalPositionId?: string | null;
};

export type ApplicationDecisionErrorCode =
  | "application_not_found"
  | "choice_not_found"
  | "invalid_final_placement"
  | "review_locked"
  | "member_application"
  | "choices_incomplete";

export class ApplicationDecisionError extends Error {
  constructor(
    public readonly code: ApplicationDecisionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationDecisionError";
  }
}

export async function updateApplicationDecision(
  applicationId: string,
  input: UpdateApplicationDecisionInput,
  reviewerEmail?: string,
) {
  await db.transaction(async (tx) => {
    const [application] = await tx
      .select({
        finalPositionId: applications.finalPositionId,
        applicationType: applications.applicationType,
        resultsReleasedAt: applications.resultsReleasedAt,
        archivedAt: applications.archivedAt,
      })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
      .for("update");

    if (!application) {
      throw new ApplicationDecisionError(
        "application_not_found",
        "Application not found.",
      );
    }
    if (application.applicationType === "member") {
      throw new ApplicationDecisionError(
        "member_application",
        "Member-only applications do not need committee decisions.",
      );
    }
    if (application.resultsReleasedAt || application.archivedAt) {
      throw new ApplicationDecisionError(
        "review_locked",
        "Decisions can no longer be changed for this application.",
      );
    }

    const choices = await tx
      .select({
        id: applicationChoices.id,
        positionId: applicationChoices.positionId,
        decisionStatus: applicationChoices.decisionStatus,
      })
      .from(applicationChoices)
      .where(eq(applicationChoices.applicationId, applicationId))
      .for("update");
    if (choices.length !== 2) {
      throw new ApplicationDecisionError(
        "choices_incomplete",
        "Application must have exactly two choices before review.",
      );
    }

    let reviewerId: string | null = null;
    if (reviewerEmail) {
      const [reviewer] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, reviewerEmail.trim().toLowerCase()))
        .limit(1);
      reviewerId = reviewer?.id ?? null;
    }

    const now = new Date();
    if (input.positionId && input.decisionStatus) {
      const choice = choices.find(
        (candidate) => candidate.positionId === input.positionId,
      );
      if (!choice) {
        throw new ApplicationDecisionError(
          "choice_not_found",
          "Position is not one of this applicant's choices.",
        );
      }

      if (input.decisionStatus === "approved") {
        for (const other of choices) {
          if (
            other.positionId !== input.positionId &&
            other.decisionStatus === "approved"
          ) {
            await tx
              .update(applicationChoices)
              .set({
                decisionStatus: "pending",
                decidedBy: null,
                decidedAt: null,
              })
              .where(eq(applicationChoices.id, other.id));
            other.decisionStatus = "pending";
          }
        }
      }

      await tx
        .update(applicationChoices)
        .set({
          decisionStatus: input.decisionStatus,
          decidedBy: reviewerId,
          decidedAt: now,
        })
        .where(
          and(
            eq(applicationChoices.applicationId, applicationId),
            eq(applicationChoices.positionId, input.positionId),
          ),
        );
      choice.decisionStatus = input.decisionStatus;
    }

    const changesFinalPlacement = Object.hasOwn(input, "finalPositionId");
    const approvedChoices = choices.filter(
      (choice) => choice.decisionStatus === "approved",
    );

    let finalPositionId = application.finalPositionId;
    if (changesFinalPlacement) {
      finalPositionId = input.finalPositionId ?? null;
    } else if (approvedChoices.length === 1) {
      finalPositionId = approvedChoices[0].positionId;
    } else if (approvedChoices.length === 0) {
      finalPositionId = null;
    }

    if (
      finalPositionId &&
      !approvedChoices.some((choice) => choice.positionId === finalPositionId)
    ) {
      if (changesFinalPlacement) {
        throw new ApplicationDecisionError(
          "invalid_final_placement",
          "Final placement must be one of the applicant's approved choices.",
        );
      }
      finalPositionId =
        approvedChoices.length === 1 ? approvedChoices[0].positionId : null;
    }

    const allDecided = choices.every(
      (choice) => choice.decisionStatus !== "pending",
    );
    const status =
      approvedChoices.length === 1 && finalPositionId
        ? "approved"
        : allDecided && approvedChoices.length === 0
          ? "rejected"
          : "pending";

    await tx
      .update(applications)
      .set({
        status,
        finalPositionId:
          approvedChoices.length === 0 ? null : finalPositionId,
        reviewedBy: reviewerId,
        reviewedAt: now,
      })
      .where(eq(applications.id, applicationId));
  });

  return getApplicationById(applicationId);
}
