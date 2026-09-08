import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  applicants,
  applicationChoices,
  applicationDocuments,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
  positions,
} from "../db/schema";
import { getApplicantEditEligibility } from "./applicant-edit-policy";

export type ApplicantChoiceInput = {
  positionId: string;
  preferenceRank: 1 | 2;
};

export type UpdateApplicantApplicationInput = {
  firstName: string;
  lastName: string;
  age: number;
  section: string;
  motivation: string;
  choices: ApplicantChoiceInput[];
  slotId?: string;
};

export type ApplicantEditErrorCode =
  | "application_not_found"
  | "application_locked"
  | "editing_unavailable"
  | "position_unavailable"
  | "slot_required"
  | "slot_not_found"
  | "slot_unavailable"
  | "wrong_committee";

export class ApplicantEditError extends Error {
  constructor(
    public readonly code: ApplicantEditErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicantEditError";
  }
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

export async function getApplicantEditableApplication(applicationId: string) {
  const [application] = await db
    .select({
      applicationCode: applications.applicationCode,
      status: applications.status,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      email: applicants.email,
      age: applicants.age,
      section: applicants.section,
      motivation: applications.motivation,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!application) return null;

  const choices = await db
    .select({
      preferenceRank: applicationChoices.preferenceRank,
      positionId: positions.id,
      title: positions.name,
      committeeId: committees.id,
      committee: committees.name,
      decisionStatus: applicationChoices.decisionStatus,
    })
    .from(applicationChoices)
    .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(applicationChoices.applicationId, applicationId));

  const documents = await db
    .select({
      documentType: applicationDocuments.documentType,
      fileName: applicationDocuments.fileName,
    })
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId));

  const eligibility = getApplicantEditEligibility(application, choices);

  return {
    applicationCode: application.applicationCode,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    age: application.age,
    section: application.section,
    motivation: application.motivation,
    choices: choices
      .map((choice) => ({
        preferenceRank: choice.preferenceRank as 1 | 2,
        positionId: choice.positionId,
        title: choice.title,
        committeeId: choice.committeeId,
        committee: choice.committee,
      }))
      .sort((a, b) => a.preferenceRank - b.preferenceRank),
    documents,
    canEdit: eligibility.canEdit,
    editDeadline: eligibility.editDeadline,
    lockReason: eligibility.lockReason,
  };
}

export async function updateApplicantApplication(
  applicationId: string,
  input: UpdateApplicantApplicationInput,
) {
  try {
    await db.transaction(async (tx) => {
      const [application] = await tx
        .select({
          applicantId: applications.applicantId,
          status: applications.status,
          archivedAt: applications.archivedAt,
          resultsReleasedAt: applications.resultsReleasedAt,
        })
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1)
        .for("update");

      if (!application) {
        throw new ApplicantEditError(
          "application_not_found",
          "Application not found.",
        );
      }

      const currentChoices = await tx
        .select({
          preferenceRank: applicationChoices.preferenceRank,
          decisionStatus: applicationChoices.decisionStatus,
          positionId: positions.id,
          committeeId: positions.committeeId,
        })
        .from(applicationChoices)
        .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
        .where(eq(applicationChoices.applicationId, applicationId))
        .for("update");

      const eligibility = getApplicantEditEligibility(
        application,
        currentChoices,
      );
      if (!eligibility.canEdit) {
        throw new ApplicantEditError(
          eligibility.blockCode === "deadline_unavailable"
            ? "editing_unavailable"
            : "application_locked",
          eligibility.lockReason ?? "This application cannot be edited.",
        );
      }

      const positionIds = input.choices.map((choice) => choice.positionId);
      const selectedPositions = await tx
        .select({
          id: positions.id,
          committeeId: positions.committeeId,
          isOpen: positions.isOpen,
        })
        .from(positions)
        .where(inArray(positions.id, positionIds));

      if (
        selectedPositions.length !== 2 ||
        selectedPositions.some((position) => !position.isOpen)
      ) {
        throw new ApplicantEditError(
          "position_unavailable",
          "One or more selected positions are unavailable.",
        );
      }

      const currentFirst = currentChoices.find(
        (choice) => choice.preferenceRank === 1,
      );
      const nextFirstInput = input.choices.find(
        (choice) => choice.preferenceRank === 1,
      );
      const nextFirst = selectedPositions.find(
        (position) => position.id === nextFirstInput?.positionId,
      );
      if (!currentFirst || !nextFirst) {
        throw new ApplicantEditError(
          "application_locked",
          "The application choices could not be updated.",
        );
      }

      const committeeChanged =
        currentFirst.committeeId !== nextFirst.committeeId;
      if (committeeChanged && !input.slotId) {
        throw new ApplicantEditError(
          "slot_required",
          "Choose a new interview slot for the new first-choice committee.",
        );
      }

      if (input.slotId) {
        const [slot] = await tx
          .select({
            id: interviewSlots.id,
            committeeId: interviewSlots.committeeId,
            startsAt: interviewSlots.startsAt,
            isOpen: interviewSlots.isOpen,
          })
          .from(interviewSlots)
          .where(eq(interviewSlots.id, input.slotId))
          .limit(1)
          .for("update");

        if (!slot) {
          throw new ApplicantEditError("slot_not_found", "Slot not found.");
        }
        if (slot.committeeId !== nextFirst.committeeId) {
          throw new ApplicantEditError(
            "wrong_committee",
            "Choose a slot for the new first-choice committee.",
          );
        }
        if (!slot.isOpen || slot.startsAt.getTime() <= Date.now()) {
          throw new ApplicantEditError(
            "slot_unavailable",
            "This interview slot is no longer available.",
          );
        }

        const [occupied] = await tx
          .select({
            applicationId: interviewBookings.applicationId,
          })
          .from(interviewBookings)
          .where(eq(interviewBookings.slotId, input.slotId))
          .limit(1);
        if (occupied && occupied.applicationId !== applicationId) {
          throw new ApplicantEditError(
            "slot_unavailable",
            "This interview slot was already booked.",
          );
        }

        const [existingBooking] = await tx
          .select({
            id: interviewBookings.id,
            slotId: interviewBookings.slotId,
          })
          .from(interviewBookings)
          .where(eq(interviewBookings.applicationId, applicationId))
          .limit(1)
          .for("update");

        if (existingBooking) {
          if (existingBooking.slotId !== input.slotId) {
            await tx
              .update(interviewBookings)
              .set({ slotId: input.slotId })
              .where(eq(interviewBookings.id, existingBooking.id));
          }
        } else {
          await tx
            .insert(interviewBookings)
            .values({ applicationId, slotId: input.slotId });
        }
      }

      await tx
        .update(applicants)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          age: input.age,
          section: input.section,
        })
        .where(eq(applicants.id, application.applicantId));

      await tx
        .update(applications)
        .set({ motivation: input.motivation })
        .where(eq(applications.id, applicationId));

      await tx
        .delete(applicationChoices)
        .where(eq(applicationChoices.applicationId, applicationId));
      await tx.insert(applicationChoices).values(
        input.choices.map((choice) => ({
          applicationId,
          positionId: choice.positionId,
          preferenceRank: choice.preferenceRank,
        })),
      );
    });
  } catch (error) {
    if (error instanceof ApplicantEditError) throw error;
    if (isUniqueViolation(error)) {
      throw new ApplicantEditError(
        "slot_unavailable",
        "The selected slot or application changed. Refresh and try again.",
      );
    }
    throw error;
  }

  const updated = await getApplicantEditableApplication(applicationId);
  if (!updated) {
    throw new ApplicantEditError(
      "application_not_found",
      "Application not found.",
    );
  }
  return updated;
}
