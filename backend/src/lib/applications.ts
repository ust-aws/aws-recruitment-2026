import { and, desc, eq, exists, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  applicants,
  applicationChoices,
  applicationDocuments,
  applications,
  committees,
  positions,
} from "../db/schema";
import {
  generateApplicationCode,
  recruitmentYearInt,
} from "./application-code";
import { bookInterviewSlotForApplication } from "./interview-scheduling";
import type { ApplicantGender } from "./applicant-gender";

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type DocumentType = "resume" | "transcript" | "registration";

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
  s3Key: string;
};

export type ApplicationJson = {
  id: string;
  applicationCode: string;
  status: ApplicationStatus;
  submittedAt: string;
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
  documents: { documentType: DocumentType; fileName: string; s3Key: string }[];
};

export type ListFilters = {
  committee?: string;
  position?: string;
  section?: string;
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
      s3Key: applicationDocuments.s3Key,
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
      s3Key: doc.s3Key,
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

export async function listApplications(filters: ListFilters): Promise<{
  applications: ApplicationJson[];
  total: number;
}> {
  const conditions = [];

  if (filters.section) {
    conditions.push(eq(applicants.section, filters.section));
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

  const rows = await db
    .select(applicationSelect)
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.submittedAt));

  const mapped = await attachRelations(rows);
  return { applications: mapped, total: mapped.length };
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
): Promise<ApplicationJson> {
  const id = await db.transaction(async (tx) => {
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
      input.documents.map((doc) => ({
        applicationId: application.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        s3Key: doc.s3Key,
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

    return application.id;
  });

  const created = await getApplicationById(id);
  if (!created) {
    throw new Error("Created application could not be loaded");
  }
  return created;
}

export async function deleteApplication(id: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: applications.id,
        applicantId: applications.applicantId,
      })
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    if (!row) return false;

    await tx.delete(applications).where(eq(applications.id, id));

    const remaining = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.applicantId, row.applicantId))
      .limit(1);
    if (remaining.length === 0) {
      await tx.delete(applicants).where(eq(applicants.id, row.applicantId));
    }
    return true;
  });
}
