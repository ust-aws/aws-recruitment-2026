import { and, eq, inArray } from "drizzle-orm";
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
  uploadSessions,
} from "../db/schema";
import { resolveApplicantEditEligibility } from "./applicant-edit-policy";
import {
  documentFileNameMatches,
  validateChoiceUrls,
} from "./apply-field-validation";
import { formatBirthday } from "./applications";
import {
  applicationKey,
  copyIncomingDocuments,
  deleteKeys,
  incomingKey,
  UPLOAD_DOCUMENT_TYPES,
  validateIncomingDocument,
  type DocumentType,
  type UploadDocumentType,
} from "./documents";

export type ApplicantChoiceInput = {
  positionId: string;
  preferenceRank: 1 | 2;
};

export type ApplicantDocumentUploadInput = {
  uploadSessionId: string;
  documentTypes: UploadDocumentType[];
};

export type UpdateApplicantApplicationInput = {
  choices?: ApplicantChoiceInput[];
  slotId?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  documentUpload?: ApplicantDocumentUploadInput;
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
      applicationType: applications.applicationType,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
      finalPositionId: applications.finalPositionId,
      memberId: applications.memberId,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      email: applicants.email,
      age: applicants.age,
      birthday: applicants.birthday,
      gender: applicants.gender,
      section: applicants.section,
      studentNumber: applicants.studentNumber,
      contactNumber: applicants.contactNumber,
      facebookUrl: applicants.facebookUrl,
      motivation: applications.motivation,
      portfolioUrl: applications.portfolioUrl,
      githubUrl: applications.githubUrl,
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
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        inArray(applicationDocuments.documentType, [...UPLOAD_DOCUMENT_TYPES]),
      ),
    );

  const eligibility =
    application.applicationType === "member"
      ? {
          canEdit: false,
          editDeadline: null,
          lockReason: "Member-only applications cannot be edited.",
        }
      : await resolveApplicantEditEligibility(application, choices);
  const sortedChoices = [...choices].sort(
    (a, b) => a.preferenceRank - b.preferenceRank,
  );
  const finalPlacement = sortedChoices.find(
    (choice) => choice.positionId === application.finalPositionId,
  );

  return {
    applicationCode: application.applicationCode,
    status: application.status,
    applicationType: application.applicationType,
    memberId: application.memberId,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    age: application.age,
    birthday: formatBirthday(application.birthday),
    gender: application.gender,
    section: application.section,
    studentNumber: application.studentNumber,
    contactNumber: application.contactNumber,
    facebookUrl: application.facebookUrl,
    motivation: application.motivation,
    portfolioUrl: application.portfolioUrl,
    githubUrl: application.githubUrl,
    choices: sortedChoices.map((choice) => ({
      preferenceRank: choice.preferenceRank as 1 | 2,
      positionId: choice.positionId,
      title: choice.title,
      committeeId: choice.committeeId,
      committee: choice.committee,
    })),
    documents,
    canEdit: eligibility.canEdit,
    editDeadline: eligibility.editDeadline,
    lockReason: eligibility.lockReason,
    result: application.resultsReleasedAt
      ? {
          status: application.status,
          releasedAt: application.resultsReleasedAt.toISOString(),
          memberId: application.memberId,
          finalPlacement: finalPlacement
            ? {
                positionId: finalPlacement.positionId,
                title: finalPlacement.title,
                committeeId: finalPlacement.committeeId,
                committee: finalPlacement.committee,
              }
            : null,
          choices: sortedChoices.map((choice) => ({
            preferenceRank: choice.preferenceRank as 1 | 2,
            decisionStatus: choice.decisionStatus,
          })),
        }
      : null,
  };
}

export async function updateApplicantApplication(
  applicationId: string,
  input: UpdateApplicantApplicationInput,
) {
  const [applicationPreview] = await db
    .select({
      status: applications.status,
      applicationType: applications.applicationType,
      archivedAt: applications.archivedAt,
      resultsReleasedAt: applications.resultsReleasedAt,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!applicationPreview) {
    throw new ApplicantEditError(
      "application_not_found",
      "Application not found.",
    );
  }

  if (applicationPreview.applicationType !== "position") {
    throw new ApplicantEditError(
      "application_locked",
      "Member-only applications cannot be edited.",
    );
  }

  const choicesPreview = await db
    .select({ decisionStatus: applicationChoices.decisionStatus })
    .from(applicationChoices)
    .where(eq(applicationChoices.applicationId, applicationId));

  const eligibilityPreview = await resolveApplicantEditEligibility(
    applicationPreview,
    choicesPreview,
  );
  if (!eligibilityPreview.canEdit) {
    throw new ApplicantEditError(
      eligibilityPreview.blockCode === "deadline_unavailable"
        ? "editing_unavailable"
        : "application_locked",
      eligibilityPreview.lockReason ?? "This application cannot be edited.",
    );
  }

  const documentsOnly =
    input.documentUpload !== undefined && input.choices === undefined;
  let committedUpload: ApplicantDocumentUploadInput | undefined;

  try {
    await db.transaction(async (tx) => {
      const [application] = await tx
        .select({
          status: applications.status,
          applicationType: applications.applicationType,
          archivedAt: applications.archivedAt,
          resultsReleasedAt: applications.resultsReleasedAt,
          portfolioUrl: applications.portfolioUrl,
          githubUrl: applications.githubUrl,
          lastName: applicants.lastName,
        })
        .from(applications)
        .innerJoin(applicants, eq(applications.applicantId, applicants.id))
        .where(eq(applications.id, applicationId))
        .limit(1)
        .for("update");

      if (!application) {
        throw new ApplicantEditError(
          "application_not_found",
          "Application not found.",
        );
      }

      if (application.applicationType !== "position") {
        throw new ApplicantEditError(
          "application_locked",
          "Member-only applications cannot be edited.",
        );
      }

      if (input.documentUpload) {
        const [uploadSession] = await tx
          .select()
          .from(uploadSessions)
          .where(eq(uploadSessions.id, input.documentUpload.uploadSessionId))
          .limit(1)
          .for("update");
        if (
          !uploadSession ||
          uploadSession.applicationId !== applicationId ||
          uploadSession.status !== "active" ||
          uploadSession.expiresAt <= new Date()
        ) {
          throw new ApplicantEditError(
            "application_locked",
            "Document upload session is invalid or expired.",
          );
        }

        const documents = input.documentUpload.documentTypes.map((documentType) => {
          const document =
            documentType === "resume"
              ? {
                  fileName: uploadSession.resumeFileName,
                  sizeBytes: uploadSession.resumeSizeBytes,
                  checksumSha256: uploadSession.resumeChecksumSha256,
                }
              : {
                  fileName: uploadSession.registrationFileName,
                  sizeBytes: uploadSession.registrationSizeBytes,
                  checksumSha256: uploadSession.registrationChecksumSha256,
                };
          if (
            !document.fileName ||
            !document.sizeBytes ||
            !document.checksumSha256 ||
            !documentFileNameMatches(
              documentType,
              document.fileName,
              application.lastName,
            )
          ) {
            throw new ApplicantEditError(
              "application_locked",
              "Document upload session is invalid or expired.",
            );
          }
          return {
            documentType,
            fileName: document.fileName,
            sizeBytes: document.sizeBytes,
            checksumSha256: document.checksumSha256,
          };
        });

        await Promise.all(
          documents.map((document) =>
            validateIncomingDocument(uploadSession.id, document),
          ),
        );
        await copyIncomingDocuments(
          uploadSession.id,
          applicationId,
          input.documentUpload.documentTypes,
        );

        for (const document of documents) {
          const [existing] = await tx
            .select({ id: applicationDocuments.id })
            .from(applicationDocuments)
            .where(
              and(
                eq(applicationDocuments.applicationId, applicationId),
                eq(applicationDocuments.documentType, document.documentType),
              ),
            )
            .limit(1);

          if (existing) {
            await tx
              .update(applicationDocuments)
              .set({
                fileName: document.fileName,
                fileSizeBytes: document.sizeBytes,
                s3Key: applicationKey(applicationId, document.documentType),
                uploadedAt: new Date(),
              })
              .where(eq(applicationDocuments.id, existing.id));
          } else {
            await tx.insert(applicationDocuments).values({
              applicationId,
              documentType: document.documentType,
              fileName: document.fileName,
              fileSizeBytes: document.sizeBytes,
              s3Key: applicationKey(applicationId, document.documentType),
            });
          }
        }

        await tx
          .update(uploadSessions)
          .set({ status: "consumed", consumedAt: new Date() })
          .where(eq(uploadSessions.id, uploadSession.id));
        committedUpload = input.documentUpload;
      }

      if (documentsOnly) {
        return;
      }

      if (!input.choices) {
        throw new ApplicantEditError(
          "application_locked",
          "choices must contain exactly two items.",
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

      const eligibility = await resolveApplicantEditEligibility(
        application,
        currentChoices,
        { database: tx },
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
          title: positions.name,
          committeeId: positions.committeeId,
          committee: committees.name,
          isOpen: positions.isOpen,
        })
        .from(positions)
        .innerJoin(committees, eq(positions.committeeId, committees.id))
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

      const choiceRefs = selectedPositions.map((row) => ({
        committee: row.committee,
        title: row.title,
      }));
      const nextPortfolio =
        input.portfolioUrl !== undefined
          ? input.portfolioUrl.trim()
          : (application.portfolioUrl?.trim() ?? "");
      const nextGithub =
        input.githubUrl !== undefined
          ? input.githubUrl.trim()
          : (application.githubUrl?.trim() ?? "");
      const urlError = validateChoiceUrls(
        choiceRefs,
        nextPortfolio,
        nextGithub,
      );
      if (urlError) {
        throw new ApplicantEditError("application_locked", urlError);
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
              .set({
                slotId: input.slotId,
                reminder24hSentAt: null,
                reminder1hSentAt: null,
              })
              .where(eq(interviewBookings.id, existingBooking.id));
          }
        } else {
          await tx
            .insert(interviewBookings)
            .values({ applicationId, slotId: input.slotId });
        }
      }

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

      await tx
        .update(applications)
        .set({
          portfolioUrl: nextPortfolio || null,
          githubUrl: nextGithub || null,
        })
        .where(eq(applications.id, applicationId));
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

  if (committedUpload) {
    const { documentTypes, uploadSessionId } = committedUpload;
    await deleteKeys(
      documentTypes.map((type) =>
        incomingKey(uploadSessionId, type),
      ),
    ).catch((error) => console.error("Could not remove incoming documents", error));
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
