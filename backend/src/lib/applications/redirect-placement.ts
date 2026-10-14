import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  applicationChoices,
  applications,
  committees,
  positions,
} from "../../db/schema";
import { kickEmailOutbox } from "../email/outbox-kick";
import { seatHuntWinner } from "../officer-hunt/seats";
import { getApplicationById, type ApplicationJson } from "./applications";

/** The seat's number or key is unique per term, so a second holder trips the unique index. */
function isSeatTaken(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") return false;
    const record = current as Record<string, unknown>;
    if (record.code === "23505") return true;
    current = record.cause;
  }
  return false;
}

export class RedirectPlacementError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = "RedirectPlacementError";
  }
}

async function loadRedirectPosition(positionId: string) {
  const [row] = await db
    .select({
      id: positions.id,
      title: positions.name,
      office: positions.office,
      committee: committees.name,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.id, positionId))
    .limit(1);
  return row ?? null;
}

export async function updateRedirectPlacement(
  applicationId: string,
  redirectPositionId: string | null,
): Promise<ApplicationJson> {
  const [application] = await db
    .select({
      id: applications.id,
      applicationType: applications.applicationType,
      archivedAt: applications.archivedAt,
      redirectResponse: applications.redirectResponse,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new RedirectPlacementError("Application not found.", 404);
  }
  if (application.archivedAt) {
    throw new RedirectPlacementError(
      "Restore the application before changing redirect placement.",
      409,
    );
  }
  if (application.applicationType !== "position") {
    throw new RedirectPlacementError(
      "Redirect placement applies only to committee applications.",
    );
  }
  if (application.redirectResponse) {
    throw new RedirectPlacementError(
      "Redirect placement cannot change after the applicant responds.",
      409,
    );
  }

  if (redirectPositionId) {
    const position = await loadRedirectPosition(redirectPositionId);
    if (!position) {
      throw new RedirectPlacementError("Position not found.", 404);
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ redirectPositionId, updatedAt: new Date() })
      .where(
        and(
          eq(applications.id, applicationId),
          isNull(applications.redirectResponse),
        ),
      );
    // A redirect replaces an accepted choice: unselect it so only one applies.
    if (!redirectPositionId) return;
    await tx
      .update(applicationChoices)
      .set({ decisionStatus: "pending", decidedBy: null, decidedAt: null })
      .where(
        and(
          eq(applicationChoices.applicationId, applicationId),
          eq(applicationChoices.decisionStatus, "approved"),
        ),
      );
    const choices = await tx
      .select({ decisionStatus: applicationChoices.decisionStatus })
      .from(applicationChoices)
      .where(eq(applicationChoices.applicationId, applicationId));
    const allRejected =
      choices.length > 0 &&
      choices.every((choice) => choice.decisionStatus === "rejected");
    await tx
      .update(applications)
      .set({
        status: allRejected ? "rejected" : "pending",
        finalPositionId: null,
      })
      .where(eq(applications.id, applicationId));
  });

  const updated = await getApplicationById(applicationId);
  if (!updated) {
    throw new RedirectPlacementError("Application not found.", 404);
  }
  return updated;
}

export async function recordRedirectResponse(
  applicationId: string,
  response: "accepted" | "declined",
): Promise<ApplicationJson> {
  const [application] = await db
    .select({
      id: applications.id,
      applicationType: applications.applicationType,
      track: applications.track,
      archivedAt: applications.archivedAt,
      redirectPositionId: applications.redirectPositionId,
      redirectResponse: applications.redirectResponse,
      resultsReleasedAt: applications.resultsReleasedAt,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new RedirectPlacementError("Application not found.", 404);
  }
  if (application.archivedAt) {
    throw new RedirectPlacementError(
      "Restore the application before recording a redirect response.",
      409,
    );
  }
  if (application.applicationType !== "position") {
    throw new RedirectPlacementError(
      "Redirect responses apply only to committee applications.",
    );
  }
  if (!application.redirectPositionId) {
    throw new RedirectPlacementError(
      "Set a redirect placement before recording a response.",
    );
  }
  if (!application.resultsReleasedAt) {
    throw new RedirectPlacementError(
      "Results must be released before recording a redirect response.",
      409,
    );
  }
  if (application.redirectResponse) {
    throw new RedirectPlacementError(
      "Redirect response was already recorded.",
      409,
    );
  }

  const respondedAt = new Date();
  if (response === "accepted") {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(applications)
          .set({
            redirectResponse: "accepted",
            redirectRespondedAt: respondedAt,
            status: "approved",
            finalPositionId: application.redirectPositionId,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, applicationId));
        // In the officer hunt, taking the offered seat makes them an officer now.
        if (application.track === "officer_hunt") await seatHuntWinner(tx, applicationId);
      });
    } catch (error) {
      if (application.track === "officer_hunt" && isSeatTaken(error)) {
        throw new RedirectPlacementError("That seat was already filled for this term.", 409);
      }
      throw error;
    }
    if (application.track === "officer_hunt") await kickEmailOutbox().catch(() => undefined);
  } else {
    await db
      .update(applications)
      .set({
        redirectResponse: "declined",
        redirectRespondedAt: respondedAt,
        status: "rejected",
        finalPositionId: null,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));
  }

  const updated = await getApplicationById(applicationId);
  if (!updated) {
    throw new RedirectPlacementError("Application not found.", 404);
  }
  return updated;
}
