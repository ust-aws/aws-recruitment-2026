import { and, asc, eq, gt, gte, isNull, lt } from "drizzle-orm";
import { db } from "../db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
  positions,
} from "../db/schema";

export const INTERVIEW_SLOT_MINUTES = 30;
const INTERVIEW_SLOT_MS = INTERVIEW_SLOT_MINUTES * 60 * 1000;

export type InterviewScheduleErrorCode =
  | "application_not_found"
  | "application_locked"
  | "committee_not_found"
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

function lockReason(
  application: {
    status: "pending" | "approved" | "rejected";
    archivedAt: Date | null;
    resultsReleasedAt: Date | null;
  },
  decisions: { decisionStatus: "pending" | "approved" | "rejected" }[],
): string | null {
  if (application.archivedAt) return "This application is archived.";
  if (application.resultsReleasedAt) {
    return "Interview scheduling is closed because results were released.";
  }
  if (application.status !== "pending") {
    return "Interview scheduling is closed for this application.";
  }
  if (
    decisions.length === 0 ||
    decisions.some((choice) => choice.decisionStatus !== "pending")
  ) {
    return "Interview scheduling is locked because review has started.";
  }
  return null;
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

export async function getApplicantInterviewSchedule(applicationId: string) {
  const [application] = await db
    .select({
      status: applications.status,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
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
  const reason = lockReason(application, decisions);

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

  const available = reason
    ? []
    : await db
        .select({
          id: interviewSlots.id,
          startsAt: interviewSlots.startsAt,
        })
        .from(interviewSlots)
        .leftJoin(
          interviewBookings,
          eq(interviewBookings.slotId, interviewSlots.id),
        )
        .where(
          and(
            eq(interviewSlots.committeeId, application.committeeId),
            eq(interviewSlots.isOpen, true),
            gt(interviewSlots.startsAt, new Date()),
            isNull(interviewBookings.id),
          ),
        )
        .orderBy(asc(interviewSlots.startsAt));

  return {
    committee: {
      id: application.committeeId,
      name: application.committeeName,
    },
    canSchedule: reason === null,
    lockReason: reason,
    booking: current
      ? {
          id: current.id,
          slotId: current.slotId,
          startsAt: current.startsAt.toISOString(),
          endsAt: endAt(current.startsAt),
          bookedAt: current.bookedAt.toISOString(),
        }
      : null,
    slots: available.map((slot) => ({
      id: slot.id,
      startsAt: slot.startsAt.toISOString(),
      endsAt: endAt(slot.startsAt),
    })),
  };
}

export async function bookApplicantInterview(
  applicationId: string,
  slotId: string,
) {
  try {
    return await db.transaction(async (tx) => {
      const [application] = await tx
        .select({
          status: applications.status,
          archivedAt: applications.archivedAt,
          resultsReleasedAt: applications.resultsReleasedAt,
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

      if (!application) {
        throw new InterviewScheduleError(
          "application_not_found",
          "Application not found.",
        );
      }

      const decisions = await tx
        .select({ decisionStatus: applicationChoices.decisionStatus })
        .from(applicationChoices)
        .where(eq(applicationChoices.applicationId, applicationId));
      const reason = lockReason(application, decisions);
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
      if (slot.committeeId !== application.committeeId) {
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

      const [existing] = await tx
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
      if (existing) {
        if (existing.slotId === slotId) {
          booking = existing;
        } else {
          [booking] = await tx
            .update(interviewBookings)
            .set({ slotId })
            .where(eq(interviewBookings.id, existing.id))
            .returning({
              id: interviewBookings.id,
              bookedAt: interviewBookings.bookedAt,
            });
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
        committeeId: application.committeeId,
        committeeName: application.committeeName,
        startsAt: slot.startsAt.toISOString(),
        endsAt: endAt(slot.startsAt),
        bookedAt: booking.bookedAt.toISOString(),
        rescheduled: Boolean(existing && existing.slotId !== slotId),
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
