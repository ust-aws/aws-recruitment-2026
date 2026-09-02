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

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type DocumentType = "resume" | "transcript";

export type ApplicationChoiceJson = {
  preferenceRank: 1 | 2;
  positionId: string;
  committee: string;
  title: string;
};

export type ApplicationDocumentJson = {
  documentType: DocumentType;
  fileName: string;
  s3Key: string;
};

export type ApplicationJson = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  section: string | null;
  motivation: string;
  choices: ApplicationChoiceJson[];
  documents: ApplicationDocumentJson[];
};

export type CreateApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  section: string;
  motivation: string;
  choices: { positionId: string; preferenceRank: 1 | 2 }[];
  documents: { documentType: DocumentType; fileName: string; s3Key: string }[];
};

export type ListFilters = {
  committee?: string;
  position?: string;
  section?: string;
};

type ApplicationRow = {
  id: string;
  status: ApplicationStatus;
  submittedAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  section: string | null;
  motivation: string;
};

function iso(value: Date): string {
  return value.toISOString();
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

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    submittedAt: iso(row.submittedAt),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    age: row.age,
    section: row.section,
    motivation: row.motivation,
    choices: (choicesByApp.get(row.id) ?? []).sort(
      (a, b) => a.preferenceRank - b.preferenceRank,
    ),
    documents: documentsByApp.get(row.id) ?? [],
  }));
}

const applicationSelect = {
  id: applications.id,
  status: applications.status,
  submittedAt: applications.submittedAt,
  firstName: applicants.firstName,
  lastName: applicants.lastName,
  email: applicants.email,
  age: applicants.age,
  section: applicants.section,
  motivation: applications.motivation,
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
    if (!applicantId) {
      const [inserted] = await tx
        .insert(applicants)
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          age: input.age,
          section: input.section,
        })
        .returning({ id: applicants.id });
      applicantId = inserted.id;
    }

    const [application] = await tx
      .insert(applications)
      .values({ applicantId, status: "pending", motivation: input.motivation })
      .returning({ id: applications.id });

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

    return application.id;
  });

  const created = await getApplicationById(id);
  if (!created) {
    throw new Error("Created application could not be loaded");
  }
  return created;
}

export async function updateApplicationStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<ApplicationJson | null> {
  const [updated] = await db
    .update(applications)
    .set({ status, reviewedAt: new Date() })
    .where(eq(applications.id, id))
    .returning({ id: applications.id });

  if (!updated) return null;
  return getApplicationById(updated.id);
}

export async function deleteApplication(id: string): Promise<boolean> {
  const deleted = await db
    .delete(applications)
    .where(eq(applications.id, id))
    .returning({ id: applications.id });
  return deleted.length > 0;
}
