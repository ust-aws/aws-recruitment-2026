import { and, asc, eq, gt, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
  positions,
} from "../../db/schema";
import { resolveApplicantEditEligibility } from "../applications/applicant-edit-policy";
import {
  assertInterviewSlotInWindow,
  InterviewWindowError,
} from "./window";

export const INTERVIEW_SLOT_MINUTES = 30;
const INTERVIEW_SLOT_MS = INTERVIEW_SLOT_MINUTES * 60 * 1000;

export type InterviewScheduleErrorCode =
  | "application_not_found"
  | "application_locked"
  | "committee_not_found"
  | "position_not_found"
  | "slot_not_found"
  | "slot_conflict"
  | "slot_unavailable"
  | "wrong_committee";

export class InterviewScheduleError extends Error {
  constructor(
    public readonly code: InterviewScheduleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "InterviewScheduleError";
  }
}

type SlotFilters = {
  committeeId?: string;
  from?: Date;
  to?: Date;
};

function endAt(startsAt: Date): string {
  return new Date(startsAt.getTime() + INTERVIEW_SLOT_MS).toISOString();
}

export async function getBookedInterviewStartsAt(
  applicationId: string,
): Promise<Date | null> {
  const booking = await getBookedInterviewBooking(applicationId);
  return booking?.startsAt ?? null;
}

export async function getBookedInterviewBooking(
  applicationId: string,
): Promise<{ slotId: string; startsAt: Date } | null> {
  const [row] = await db
    .select({
      slotId: interviewBookings.slotId,
      startsAt: interviewSlots.startsAt,
    })
    .from(interviewBookings)
    .innerJoin(interviewSlots, eq(interviewBookings.slotId, interviewSlots.id))
    .where(eq(interviewBookings.applicationId, applicationId))
    .limit(1);
  if (!row) return null;
  return { slotId: row.slotId, startsAt: row.startsAt };
}

type CommitteeSlotRow = {
  id: string;
  startsAt: Date;
  bookedBy: string | null;
};

function partitionCommitteeSlots(
  rows: CommitteeSlotRow[],
  applicationId?: string,
) {
  const slots: { id: string; startsAt: string; endsAt: string }[] = [];
  const booked: { startsAt: string; endsAt: string }[] = [];

  for (const row of rows) {
    const startsAt = row.startsAt.toISOString();
    const endsAtIso = endAt(row.startsAt);
    if (!row.bookedBy) {
      slots.push({ id: row.id, startsAt, endsAt: endsAtIso });
      continue;
    }
    if (applicationId && row.bookedBy === applicationId) {
      slots.push({ id: row.id, startsAt, endsAt: endsAtIso });
      continue;
    }
    booked.push({ startsAt, endsAt: endsAtIso });
  }

  return { slots, booked };
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object") return false;
    const record = current as Record<string, unknown>;
    if (record.code === "23505") return true;
    current = record.cause;
  }
  return false;
}

export async function listInterviewSlotsForHr(filters: SlotFilters) {
  const conditions = [];
  if (filters.committeeId) {
    conditions.push(eq(interviewSlots.committeeId, filters.committeeId));
  }
  if (filters.from) {
    conditions.push(gte(interviewSlots.startsAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lt(interviewSlots.startsAt, filters.to));
  }

  const rows = await db
    .select({
      id: interviewSlots.id,
      committeeId: interviewSlots.committeeId,
      committeeName: committees.name,
      startsAt: interviewSlots.startsAt,
      isOpen: interviewSlots.isOpen,
      bookingId: interviewBookings.id,
      applicationId: applications.id,
      applicationCode: applications.applicationCode,
      applicantFirstName: applicants.firstName,
      applicantLastName: applicants.lastName,
    })
    .from(interviewSlots)
    .innerJoin(committees, eq(interviewSlots.committeeId, committees.id))
    .leftJoin(
      interviewBookings,
      eq(interviewBookings.slotId, interviewSlots.id),
    )
    .leftJoin(
      applications,
      eq(interviewBookings.applicationId, applications.id),
    )
    .leftJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(interviewSlots.startsAt), asc(committees.name));

  const now = Date.now();
  return rows.map((row) => ({
    id: row.id,
    committeeId: row.committeeId,
    committeeName: row.committeeName,
    startsAt: row.startsAt.toISOString(),
    endsAt: endAt(row.startsAt),
    isOpen: row.isOpen,
    isAvailable:
      row.isOpen && row.startsAt.getTime() > now && row.bookingId === null,
    booking: row.bookingId
      ? {
          id: row.bookingId,
          applicationId: row.applicationId,
          applicationCode: row.applicationCode,
          applicantName: [row.applicantFirstName, row.applicantLastName]
            .filter(Boolean)
            .join(" "),
        }
      : null,
  }));
}

export async function createInterviewSlot(
  committeeId: string,
  startsAt: Date,
) {
  const [committee] = await db
    .select({ id: committees.id, name: committees.name })
    .from(committees)
    .where(eq(committees.id, committeeId))
    .limit(1);

  if (!committee) {
    throw new InterviewScheduleError(
      "committee_not_found",
      "Committee not found.",
    );
  }

  try {
    await assertInterviewSlotInWindow(startsAt);
  } catch (error) {
    if (error instanceof InterviewWindowError) {
      throw new InterviewScheduleError("slot_conflict", error.message);
    }
    throw error;
  }

  try {
    const [slot] = await db
      .insert(interviewSlots)
      .values({ committeeId, startsAt })
      .returning({
        id: interviewSlots.id,
        isOpen: interviewSlots.isOpen,
      });

    return {
      id: slot.id,
      committeeId,
      committeeName: committee.name,
      startsAt: startsAt.toISOString(),
      endsAt: endAt(startsAt),
      isOpen: slot.isOpen,
      isAvailable: true,
      booking: null,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new InterviewScheduleError(
        "slot_conflict",
        "This committee already has a slot at that time.",
      );
    }
    throw error;
  }
}

export async function resetInterviewScheduleForCommittee(committeeId: string) {
  const [committee] = await db
    .select({ id: committees.id, name: committees.name })
    .from(committees)
    .where(eq(committees.id, committeeId))
    .limit(1);

  if (!committee) {
    throw new InterviewScheduleError(
      "committee_not_found",
      "Committee not found.",
    );
  }

  return db.transaction(async (tx) => {
    const slots = await tx
      .select({ id: interviewSlots.id })
      .from(interviewSlots)
      .where(eq(interviewSlots.committeeId, committeeId));

    const slotIds = slots.map((slot) => slot.id);
    let deletedBookings = 0;

    if (slotIds.length > 0) {
      const removedBookings = await tx
        .delete(interviewBookings)
        .where(inArray(interviewBookings.slotId, slotIds))
        .returning({ id: interviewBookings.id });
      deletedBookings = removedBookings.length;
    }

    const removedSlots = await tx
      .delete(interviewSlots)
      .where(eq(interviewSlots.committeeId, committeeId))
      .returning({ id: interviewSlots.id });

    return {
      committeeId,
      committeeName: committee.name,
      deletedSlots: removedSlots.length,
      deletedBookings,
    };
  });
}

export async function setInterviewSlotOpen(id: string, isOpen: boolean) {
  return db.transaction(async (tx) => {
    const [slot] = await tx
      .select({
        id: interviewSlots.id,
        committeeId: interviewSlots.committeeId,
        committeeName: committees.name,
        startsAt: interviewSlots.startsAt,
        isOpen: interviewSlots.isOpen,
      })
      .from(interviewSlots)
      .innerJoin(committees, eq(interviewSlots.committeeId, committees.id))
      .where(eq(interviewSlots.id, id))
      .limit(1)
      .for("update");

    if (!slot) {
      throw new InterviewScheduleError("slot_not_found", "Slot not found.");
    }

    if (isOpen && slot.startsAt.getTime() <= Date.now()) {
      throw new InterviewScheduleError(
        "slot_unavailable",
        "Past interview slots cannot be reopened.",
      );
    }

    if (!isOpen) {
      const [booking] = await tx
        .select({ id: interviewBookings.id })
        .from(interviewBookings)
        .where(eq(interviewBookings.slotId, id))
        .limit(1);
      if (booking) {
        throw new InterviewScheduleError(
          "slot_unavailable",
          "A booked interview slot cannot be closed.",
        );
      }
    }

    await tx
      .update(interviewSlots)
      .set({ isOpen })
      .where(eq(interviewSlots.id, id));

    return {
      id: slot.id,
      committeeId: slot.committeeId,
      committeeName: slot.committeeName,
      startsAt: slot.startsAt.toISOString(),
      endsAt: endAt(slot.startsAt),
      isOpen,
      isAvailable: isOpen && slot.startsAt.getTime() > Date.now(),
      booking: null,
    };
  });
}

export async function listOpenInterviewSlotsForPosition(positionId: string) {
  const [position] = await db
    .select({
      isOpen: positions.isOpen,
      committeeId: committees.id,
      committeeName: committees.name,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.id, positionId))
    .limit(1);

  if (!position || !position.isOpen) {
    throw new InterviewScheduleError(
      "position_not_found",
      "The selected position is not available.",
    );
  }

  const rows = await db
    .select({
      id: interviewSlots.id,
      startsAt: interviewSlots.startsAt,
      bookedBy: interviewBookings.applicationId,
    })
    .from(interviewSlots)
    .leftJoin(
      interviewBookings,
      eq(interviewBookings.slotId, interviewSlots.id),
    )
    .where(
      and(
        eq(interviewSlots.committeeId, position.committeeId),
        eq(interviewSlots.isOpen, true),
        gt(interviewSlots.startsAt, new Date()),
      ),
    )
    .orderBy(asc(interviewSlots.startsAt));

  const { slots, booked } = partitionCommitteeSlots(rows);

  return {
    committee: {
      id: position.committeeId,
      name: position.committeeName,
    },
    slots,
    booked,
  };
}

type DbExecutor = Pick<typeof db, "select" | "insert" | "update">;

export async function bookInterviewSlotForApplication(
  tx: DbExecutor,
  applicationId: string,
  firstChoicePositionId: string,
  slotId: string,
) {
  const [position] = await tx
    .select({ committeeId: positions.committeeId })
    .from(positions)
    .where(eq(positions.id, firstChoicePositionId))
    .limit(1);

  if (!position) {
    throw new InterviewScheduleError(
      "position_not_found",
      "The first-choice position is not available.",
    );
  }

  const [slot] = await tx
    .select({
      id: interviewSlots.id,
      committeeId: interviewSlots.committeeId,
      startsAt: interviewSlots.startsAt,
      isOpen: interviewSlots.isOpen,
    })
    .from(interviewSlots)
    .where(eq(interviewSlots.id, slotId))
    .limit(1)
    .for("update");

  if (!slot) {
    throw new InterviewScheduleError("slot_not_found", "Slot not found.");
  }
  if (slot.committeeId !== position.committeeId) {
    throw new InterviewScheduleError(
      "wrong_committee",
      "Choose a slot for your first-choice committee.",
    );
  }
  if (!slot.isOpen || slot.startsAt.getTime() <= Date.now()) {
    throw new InterviewScheduleError(
      "slot_unavailable",
      "This interview slot is no longer available.",
    );
  }

  const [occupied] = await tx
    .select({ id: interviewBookings.id })
    .from(interviewBookings)
    .where(eq(interviewBookings.slotId, slotId))
    .limit(1);
  if (occupied) {
    throw new InterviewScheduleError(
      "slot_unavailable",
      "This interview slot was already booked.",
    );
  }

  try {
    await tx.insert(interviewBookings).values({ applicationId, slotId });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new InterviewScheduleError(
        "slot_unavailable",
        "This interview slot was already booked.",
      );
    }
    throw error;
  }
}

export async function getApplicantInterviewSchedule(
  applicationId: string,
  positionId?: string,
) {
  const [application] = await db
    .select({
      status: applications.status,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new InterviewScheduleError(
      "application_not_found",
      "Application not found.",
    );
  }

  const [targetCommittee] = positionId
    ? await db
        .select({
          id: committees.id,
          name: committees.name,
          isOpen: positions.isOpen,
        })
        .from(positions)
        .innerJoin(committees, eq(positions.committeeId, committees.id))
        .where(eq(positions.id, positionId))
        .limit(1)
    : await db
        .select({
          id: committees.id,
          name: committees.name,
          isOpen: positions.isOpen,
        })
        .from(applicationChoices)
        .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
        .innerJoin(committees, eq(positions.committeeId, committees.id))
        .where(
          and(
            eq(applicationChoices.applicationId, applicationId),
            eq(applicationChoices.preferenceRank, 1),
          ),
        )
        .limit(1);

  if (!targetCommittee || !targetCommittee.isOpen) {
    throw new InterviewScheduleError(
      positionId ? "position_not_found" : "application_not_found",
      positionId
        ? "The selected position is not available."
        : "The first-choice position could not be found.",
    );
  }

  const decisions = await db
    .select({ decisionStatus: applicationChoices.decisionStatus })
    .from(applicationChoices)
    .where(eq(applicationChoices.applicationId, applicationId));
  const eligibility = await resolveApplicantEditEligibility(application, decisions);
  const reason = eligibility.lockReason;

  const [current] = await db
    .select({
      id: interviewBookings.id,
      slotId: interviewSlots.id,
      startsAt: interviewSlots.startsAt,
      bookedAt: interviewBookings.bookedAt,
    })
    .from(interviewBookings)
    .innerJoin(interviewSlots, eq(interviewBookings.slotId, interviewSlots.id))
    .where(eq(interviewBookings.applicationId, applicationId))
    .limit(1);

  const canSchedule = reason === null;
  const lockReason = reason;

  const rows = canSchedule
    ? await db
        .select({
          id: interviewSlots.id,
          startsAt: interviewSlots.startsAt,
          bookedBy: interviewBookings.applicationId,
        })
        .from(interviewSlots)
        .leftJoin(
          interviewBookings,
          eq(interviewBookings.slotId, interviewSlots.id),
        )
        .where(
          and(
            eq(interviewSlots.committeeId, targetCommittee.id),
            eq(interviewSlots.isOpen, true),
            gt(interviewSlots.startsAt, new Date()),
          ),
        )
        .orderBy(asc(interviewSlots.startsAt))
    : [];

  const { slots, booked } = partitionCommitteeSlots(rows, applicationId);
  const previewingOtherCommittee = Boolean(positionId);
  const bookingBelongsToTarget =
    Boolean(current) && slots.some((slot) => slot.id === current?.slotId);

  return {
    committee: {
      id: targetCommittee.id,
      name: targetCommittee.name,
    },
    canSchedule,
    lockReason,
    booking:
      current && (!previewingOtherCommittee || bookingBelongsToTarget)
        ? {
            id: current.id,
            slotId: current.slotId,
            startsAt: current.startsAt.toISOString(),
            endsAt: endAt(current.startsAt),
            bookedAt: current.bookedAt.toISOString(),
          }
        : null,
    slots,
    booked,
  };
}

export async function bookApplicantInterview(
  applicationId: string,
  slotId: string,
) {
  const [application] = await db
    .select({
      status: applications.status,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application) {
    throw new InterviewScheduleError(
      "application_not_found",
      "Application not found.",
    );
  }

  const decisions = await db
    .select({ decisionStatus: applicationChoices.decisionStatus })
    .from(applicationChoices)
    .where(eq(applicationChoices.applicationId, applicationId));
  const eligibility = await resolveApplicantEditEligibility(
    application,
    decisions,
  );
  if (eligibility.lockReason) {
    throw new InterviewScheduleError(
      "application_locked",
      eligibility.lockReason,
    );
  }

  const [existingBooking] = await db
    .select({
      id: interviewBookings.id,
      slotId: interviewBookings.slotId,
    })
    .from(interviewBookings)
    .where(eq(interviewBookings.applicationId, applicationId))
    .limit(1);

  try {
    return await db.transaction(async (tx) => {
      const [applicationRow] = await tx
        .select({
          committeeId: committees.id,
          committeeName: committees.name,
        })
        .from(applications)
        .innerJoin(
          applicationChoices,
          and(
            eq(applicationChoices.applicationId, applications.id),
            eq(applicationChoices.preferenceRank, 1),
          ),
        )
        .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
        .innerJoin(committees, eq(positions.committeeId, committees.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationRow) {
        throw new InterviewScheduleError(
          "application_not_found",
          "Application not found.",
        );
      }

      const decisions = await tx
        .select({ decisionStatus: applicationChoices.decisionStatus })
        .from(applicationChoices)
        .where(eq(applicationChoices.applicationId, applicationId));
      const reason = (
        await resolveApplicantEditEligibility(application, decisions, {
          database: tx,
        })
      ).lockReason;
      if (reason) {
        throw new InterviewScheduleError("application_locked", reason);
      }

      const [slot] = await tx
        .select({
          id: interviewSlots.id,
          committeeId: interviewSlots.committeeId,
          startsAt: interviewSlots.startsAt,
          isOpen: interviewSlots.isOpen,
        })
        .from(interviewSlots)
        .where(eq(interviewSlots.id, slotId))
        .limit(1)
        .for("update");

      if (!slot) {
        throw new InterviewScheduleError("slot_not_found", "Slot not found.");
      }
      if (slot.committeeId !== applicationRow.committeeId) {
        throw new InterviewScheduleError(
          "wrong_committee",
          "Choose a slot for your first-choice committee.",
        );
      }
      if (!slot.isOpen || slot.startsAt.getTime() <= Date.now()) {
        throw new InterviewScheduleError(
          "slot_unavailable",
          "This interview slot is no longer available.",
        );
      }

      const [occupied] = await tx
        .select({
          id: interviewBookings.id,
          applicationId: interviewBookings.applicationId,
        })
        .from(interviewBookings)
        .where(eq(interviewBookings.slotId, slotId))
        .limit(1);
      if (occupied && occupied.applicationId !== applicationId) {
        throw new InterviewScheduleError(
          "slot_unavailable",
          "This interview slot was already booked.",
        );
      }

      const [existing] = existingBooking
        ? await tx
            .select({
              id: interviewBookings.id,
              slotId: interviewBookings.slotId,
              bookedAt: interviewBookings.bookedAt,
            })
            .from(interviewBookings)
            .where(eq(interviewBookings.id, existingBooking.id))
            .limit(1)
            .for("update")
        : await tx
            .select({
              id: interviewBookings.id,
              slotId: interviewBookings.slotId,
              bookedAt: interviewBookings.bookedAt,
            })
            .from(interviewBookings)
            .where(eq(interviewBookings.applicationId, applicationId))
            .limit(1)
            .for("update");

      let booking: {
        id: string;
        bookedAt: Date;
      };
      let rescheduled = false;
      if (existing) {
        if (existing.slotId === slotId) {
          booking = existing;
        } else {
          [booking] = await tx
            .update(interviewBookings)
            .set({
              slotId,
              reminder24hSentAt: null,
              reminder1hSentAt: null,
            })
            .where(eq(interviewBookings.id, existing.id))
            .returning({
              id: interviewBookings.id,
              bookedAt: interviewBookings.bookedAt,
            });
          rescheduled = true;
        }
      } else {
        [booking] = await tx
          .insert(interviewBookings)
          .values({ applicationId, slotId })
          .returning({
            id: interviewBookings.id,
            bookedAt: interviewBookings.bookedAt,
          });
      }

      return {
        id: booking.id,
        slotId,
        committeeId: applicationRow.committeeId,
        committeeName: applicationRow.committeeName,
        startsAt: slot.startsAt.toISOString(),
        endsAt: endAt(slot.startsAt),
        bookedAt: booking.bookedAt.toISOString(),
        rescheduled,
      };
    });
  } catch (error) {
    if (error instanceof InterviewScheduleError) throw error;
    if (isUniqueViolation(error)) {
      throw new InterviewScheduleError(
        "slot_unavailable",
        "The slot or application booking changed. Refresh and try again.",
      );
    }
    throw error;
  }
}
