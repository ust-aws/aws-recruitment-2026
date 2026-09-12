import {
  and,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import {
  applicants,
  applicationChoices,
  applicationDocuments,
  applications,
  committees,
  positions,
  uploadSessions,
  users,
} from "../db/schema";
import {
  applicationKey,
  copyIncomingDocuments,
  DOCUMENT_TYPES,
  deleteKeys,
  incomingKey,
  type DocumentType,
  validateIncomingDocument,
} from "./documents";
import { freePlanEndDate } from "./free-plan";
import {
  generateApplicationCode,
  recruitmentYearInt,
} from "./application-code";
import { bookInterviewSlotForApplication } from "./interview-scheduling";
import type { ApplicantGender } from "./applicant-gender";

export type { DocumentType } from "./documents";

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ApplicationChoiceJson = {
  preferenceRank: 1 | 2;
  positionId: string;
  committee: string;
  title: string;
  decisionStatus: "pending" | "approved" | "rejected";
};

export type ApplicationDocumentJson = {
  documentType: DocumentType;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  availableUntil: string;
};

export type ApplicationJson = {
  id: string;
  applicationCode: string;
  status: ApplicationStatus;
  submittedAt: string;
  archivedAt: string | null;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  birthday: string | null;
  gender: ApplicantGender | null;
  section: string | null;
  studentNumber: string | null;
  contactNumber: string | null;
  facebookUrl: string | null;
  motivation: string;
  portfolioUrl: string | null;
  githubUrl: string | null;
  choices: ApplicationChoiceJson[];
  finalPlacement: {
    positionId: string;
    committee: string;
    title: string;
  } | null;
  documents: ApplicationDocumentJson[];
};

export type CreateApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  birthday: string;
  gender: ApplicantGender;
  section: string;
  studentNumber: string;
  contactNumber: string;
  facebookUrl: string;
  motivation: string;
  dataPrivacyAgreed: true;
  portfolioUrl?: string;
  githubUrl?: string;
  slotId: string;
  choices: { positionId: string; preferenceRank: 1 | 2 }[];
  uploadSessionId: string;
};

export type ListFilters = {
  committee?: string;
  committeeName?: string;
  position?: string;
  section?: string;
  query?: string;
  status?: ApplicationStatus;
  archive?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
};

export class ApplicationAlreadySubmittedError extends Error {
  constructor() {
    super(
      "You already submitted an application for this recruitment cycle. Only one application per year is allowed.",
    );
    this.name = "ApplicationAlreadySubmittedError";
  }
}

function isApplicationCodeCollision(err: unknown): boolean {
  const inspect = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    if (
      record.constraint_name === "applications_application_code_key" ||
      record.constraint_name === "applications_application_code_unique"
    ) {
      return true;
    }
    if (typeof record.message === "string") {
      const message = record.message.toLowerCase();
      return (
        message.includes("application_code") &&
        (message.includes("unique") || message.includes("duplicate"))
      );
    }
    return false;
  };

  if (inspect(err)) return true;
  if (err instanceof Error) {
    if (inspect(err.cause)) return true;
    const message = err.message.toLowerCase();
    return (
      message.includes("application_code") &&
      (message.includes("unique") || message.includes("duplicate"))
    );
  }
  return false;
}

type ApplicationRow = {
  id: string;
  applicationCode: string;
  status: ApplicationStatus;
  submittedAt: Date;
  archivedAt: Date | null;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  birthday: string | Date | null;
  gender: ApplicantGender | null;
  section: string | null;
  studentNumber: string | null;
  contactNumber: string | null;
  facebookUrl: string | null;
  motivation: string;
  portfolioUrl: string | null;
  githubUrl: string | null;
  finalPositionId: string | null;
};

function iso(value: Date): string {
  return value.toISOString();
}

export function formatBirthday(value: string | Date | null): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function attachRelations(
  rows: ApplicationRow[],
): Promise<ApplicationJson[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  const choiceRows = await db
    .select({
      applicationId: applicationChoices.applicationId,
      preferenceRank: applicationChoices.preferenceRank,
      positionId: applicationChoices.positionId,
      committee: committees.name,
      title: positions.name,
      decisionStatus: applicationChoices.decisionStatus,
    })
    .from(applicationChoices)
    .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(inArray(applicationChoices.applicationId, ids));

  const documentRows = await db
    .select({
      applicationId: applicationDocuments.applicationId,
      documentType: applicationDocuments.documentType,
      fileName: applicationDocuments.fileName,
      fileSizeBytes: applicationDocuments.fileSizeBytes,
      uploadedAt: applicationDocuments.uploadedAt,
      availableUntil: applicationDocuments.availableUntil,
    })
    .from(applicationDocuments)
    .where(inArray(applicationDocuments.applicationId, ids));

  const choicesByApp = new Map<string, ApplicationChoiceJson[]>();
  for (const choice of choiceRows) {
    const list = choicesByApp.get(choice.applicationId) ?? [];
    list.push({
      preferenceRank: choice.preferenceRank as 1 | 2,
      positionId: choice.positionId,
      committee: choice.committee,
      title: choice.title,
      decisionStatus: choice.decisionStatus,
    });
    choicesByApp.set(choice.applicationId, list);
  }

  const documentsByApp = new Map<string, ApplicationDocumentJson[]>();
  for (const doc of documentRows) {
    const list = documentsByApp.get(doc.applicationId) ?? [];
    list.push({
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSizeBytes: doc.fileSizeBytes,
      uploadedAt: iso(doc.uploadedAt),
      availableUntil: iso(doc.availableUntil ?? freePlanEndDate() ?? new Date(0)),
    });
    documentsByApp.set(doc.applicationId, list);
  }

  return rows.map((row) => {
    const choices = (choicesByApp.get(row.id) ?? []).sort(
      (a, b) => a.preferenceRank - b.preferenceRank,
    );
    const finalPlacement = choices.find(
      (choice) => choice.positionId === row.finalPositionId,
    );
    return {
      id: row.id,
      applicationCode: row.applicationCode,
      status: row.status,
      submittedAt: iso(row.submittedAt),
      archivedAt: row.archivedAt ? iso(row.archivedAt) : null,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      age: row.age,
      birthday: formatBirthday(row.birthday),
      gender: row.gender,
      section: row.section,
      studentNumber: row.studentNumber,
      contactNumber: row.contactNumber,
      facebookUrl: row.facebookUrl,
      motivation: row.motivation,
      portfolioUrl: row.portfolioUrl,
      githubUrl: row.githubUrl,
      choices,
      finalPlacement: finalPlacement
        ? {
            positionId: finalPlacement.positionId,
            committee: finalPlacement.committee,
            title: finalPlacement.title,
          }
        : null,
      documents: documentsByApp.get(row.id) ?? [],
    };
  });
}

const applicationSelect = {
  id: applications.id,
  applicationCode: applications.applicationCode,
  status: applications.status,
  submittedAt: applications.submittedAt,
  archivedAt: applications.archivedAt,
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
  finalPositionId: applications.finalPositionId,
};

export async function getApplicationById(
  id: string,
): Promise<ApplicationJson | null> {
  const rows = await db
    .select(applicationSelect)
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  const [mapped] = await attachRelations(rows);
  return mapped;
}

export async function getApplicationDocument(
  applicationId: string,
  type: DocumentType,
): Promise<{
  fileName: string;
  s3Key: string;
  availableUntil: Date | null;
} | null> {
  const [document] = await db
    .select({
      fileName: applicationDocuments.fileName,
      s3Key: applicationDocuments.s3Key,
      availableUntil: applicationDocuments.availableUntil,
    })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        eq(applicationDocuments.documentType, type),
      ),
    )
    .limit(1);
  return document ?? null;
}

export async function listApplications(filters: ListFilters): Promise<{
  applications: ApplicationJson[];
  total: number;
}> {
  const conditions = [];
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  if (filters.archive === "archived") {
    conditions.push(isNotNull(applications.archivedAt));
  } else if (filters.archive !== "all") {
    conditions.push(isNull(applications.archivedAt));
  }

  if (filters.section) {
    conditions.push(eq(applicants.section, filters.section));
  }

  if (filters.query) {
    conditions.push(
      ilike(
        sql`${applicants.firstName} || ' ' || ${applicants.lastName}`,
        `%${filters.query}%`,
      ),
    );
  }

  if (filters.status) {
    conditions.push(eq(applications.status, filters.status));
  }

  if (filters.committee) {
    conditions.push(
      exists(
        db
          .select({ id: applicationChoices.id })
          .from(applicationChoices)
          .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
          .where(
            and(
              eq(applicationChoices.applicationId, applications.id),
              eq(positions.committeeId, filters.committee),
            ),
          ),
      ),
    );
  }

  if (filters.committeeName) {
    conditions.push(
      exists(
        db
          .select({ id: applicationChoices.id })
          .from(applicationChoices)
          .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
          .innerJoin(committees, eq(positions.committeeId, committees.id))
          .where(
            and(
              eq(applicationChoices.applicationId, applications.id),
              eq(committees.name, filters.committeeName),
            ),
          ),
      ),
    );
  }

  if (filters.position) {
    conditions.push(
      exists(
        db
          .select({ id: applicationChoices.id })
          .from(applicationChoices)
          .where(
            and(
              eq(applicationChoices.applicationId, applications.id),
              eq(applicationChoices.positionId, filters.position),
            ),
          ),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select(applicationSelect)
      .from(applications)
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .where(where)
      .orderBy(desc(applications.submittedAt), desc(applications.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(applications)
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .where(where),
  ]);

  const mapped = await attachRelations(rows);
  return { applications: mapped, total: totalRows[0]?.total ?? 0 };
}

export async function positionsExist(positionIds: string[]): Promise<boolean> {
  if (positionIds.length === 0) return false;
  const uniqueIds = [...new Set(positionIds)];
  const rows = await db
    .select({ id: positions.id })
    .from(positions)
    .where(inArray(positions.id, uniqueIds));
  return rows.length === uniqueIds.length;
}

export async function committeeNamesForPositions(
  positionIds: string[],
): Promise<string[]> {
  if (positionIds.length === 0) return [];
  const rows = await db
    .select({ committee: committees.name })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(inArray(positions.id, positionIds));
  return rows.map((row) => row.committee);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<{ application: ApplicationJson; created: boolean }> {
  let copiedApplicationId: string | null = null;
  let transactionComplete = false;
  try {
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(uploadSessions)
        .where(eq(uploadSessions.id, input.uploadSessionId))
        .for("update");

      if (!session) throw new Error("Upload session was not found.");
      if (session.status === "consumed" && session.applicationId) {
        return { id: session.applicationId, created: false };
      }
      if (session.status !== "active" || session.expiresAt <= new Date()) {
        if (session.status === "active") {
          await tx
            .update(uploadSessions)
            .set({ status: "expired" })
            .where(eq(uploadSessions.id, session.id));
        }
        throw new Error("Upload session has expired.");
      }

      const documents = [
        {
          documentType: "resume" as const,
          fileName: session.resumeFileName,
          sizeBytes: session.resumeSizeBytes,
          checksumSha256: session.resumeChecksumSha256,
        },
        {
          documentType: "transcript" as const,
          fileName: session.transcriptFileName,
          sizeBytes: session.transcriptSizeBytes,
          checksumSha256: session.transcriptChecksumSha256,
        },
        {
          documentType: "registration" as const,
          fileName: session.registrationFileName,
          sizeBytes: session.registrationSizeBytes,
          checksumSha256: session.registrationChecksumSha256,
        },
      ];
      await Promise.all(
        documents.map((document) => validateIncomingDocument(session.id, document)),
      );

      const applicationId = randomUUID();
      copiedApplicationId = applicationId;
      await copyIncomingDocuments(session.id, applicationId);

      const existing = await tx
        .select({ id: applicants.id })
        .from(applicants)
        .where(eq(applicants.email, input.email))
        .limit(1);

      let applicantId = existing[0]?.id;
      const applicantProfile = {
        firstName: input.firstName,
        lastName: input.lastName,
        age: input.age,
        birthday: input.birthday,
        gender: input.gender,
        section: input.section,
        studentNumber: input.studentNumber,
        contactNumber: input.contactNumber,
        facebookUrl: input.facebookUrl,
      };
      if (!applicantId) {
        const [inserted] = await tx
          .insert(applicants)
          .values({
            ...applicantProfile,
            email: input.email,
          })
          .returning({ id: applicants.id });
        applicantId = inserted.id;
      } else {
        await tx
          .update(applicants)
          .set(applicantProfile)
          .where(eq(applicants.id, applicantId));
      }

      const recruitmentYear = recruitmentYearInt();
      const [existingForCycle] = await tx
        .select({ id: applications.id })
        .from(applications)
        .where(
          and(
            eq(applications.applicantId, applicantId),
            eq(applications.recruitmentYear, recruitmentYear),
          ),
        )
        .limit(1);

      if (existingForCycle) {
        throw new ApplicationAlreadySubmittedError();
      }

      const [application] = await (async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            return await tx
              .insert(applications)
              .values({
                id: applicationId,
                applicantId,
                applicationCode: generateApplicationCode(),
                recruitmentYear,
                status: "pending",
                motivation: input.motivation,
                dataPrivacyAgreedAt: new Date(),
                portfolioUrl: input.portfolioUrl?.trim() || null,
                githubUrl: input.githubUrl?.trim() || null,
              })
              .returning({ id: applications.id });
          } catch (err) {
            if (!isApplicationCodeCollision(err)) {
              throw err;
            }
          }
        }
        throw new Error("Could not generate a unique application code");
      })();

      await tx.insert(applicationChoices).values(
        input.choices.map((choice) => ({
          applicationId: application.id,
          positionId: choice.positionId,
          preferenceRank: choice.preferenceRank,
        })),
      );

      await tx.insert(applicationDocuments).values(
        documents.map((doc) => ({
          applicationId: application.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSizeBytes: doc.sizeBytes,
          s3Key: applicationKey(application.id, doc.documentType),
          availableUntil: freePlanEndDate(),
        })),
      );

      const firstChoice = input.choices.find((choice) => choice.preferenceRank === 1);
      if (!firstChoice) {
        throw new Error("Application is missing a first-choice position.");
      }
      await bookInterviewSlotForApplication(
        tx,
        application.id,
        firstChoice.positionId,
        input.slotId,
      );

      await tx
        .update(uploadSessions)
        .set({
          status: "consumed",
          applicationId: application.id,
          consumedAt: new Date(),
        })
        .where(eq(uploadSessions.id, session.id));

      return { id: application.id, created: true };
    });
    transactionComplete = true;

    if (result.created) {
      await deleteKeys(
        DOCUMENT_TYPES.map((type) => incomingKey(input.uploadSessionId, type)),
      ).catch((error) => console.error("Could not remove incoming documents", error));
    }
    const application = await getApplicationById(result.id);
    if (!application) throw new Error("Created application could not be loaded.");
    return { application, created: result.created };
  } catch (error) {
    if (!transactionComplete && copiedApplicationId) {
      const applicationId = copiedApplicationId;
      await deleteKeys(
        DOCUMENT_TYPES.map((type) => applicationKey(applicationId, type)),
      ).catch(() => undefined);
    }
    throw error;
  }
}

export async function setApplicationArchived(
  id: string,
  archived: boolean,
  reviewerEmail?: string,
): Promise<ApplicationJson | null> {
  const found = await db.transaction(async (tx) => {
    const [application] = await tx
      .select({ archivedAt: applications.archivedAt })
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1)
      .for("update");
    if (!application) return false;

    const alreadyInRequestedState = archived
      ? application.archivedAt !== null
      : application.archivedAt === null;
    if (alreadyInRequestedState) return true;

    let reviewerId: string | null = null;
    if (archived && reviewerEmail) {
      const [reviewer] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, reviewerEmail.trim().toLowerCase()))
        .limit(1);
      reviewerId = reviewer?.id ?? null;
    }

    await tx
      .update(applications)
      .set(
        archived
          ? {
              archivedAt: new Date(),
              archivedBy: reviewerId,
              archiveReason: null,
            }
          : {
              archivedAt: null,
              archivedBy: null,
              archiveReason: null,
            },
      )
      .where(eq(applications.id, id));
    return true;
  });

  return found ? getApplicationById(id) : null;
}
