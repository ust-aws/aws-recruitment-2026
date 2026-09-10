import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  positions,
} from "../db/schema";
import { recruitmentYearInt } from "./application-code";

export type ResultClassification = "accepted" | "rejected" | "incomplete";
export type ChoiceDecisionStatus = "pending" | "approved" | "rejected";

export type ResultPreviewChoice = {
  preferenceRank: 1 | 2;
  positionId: string;
  title: string;
  committeeId: string;
  committee: string;
  decisionStatus: ChoiceDecisionStatus;
};

export type ResultPreviewApplication = {
  id: string;
  applicationCode: string;
  applicant: {
    fullName: string;
    email: string;
  };
  applicationStatus: "pending" | "approved" | "rejected";
  submittedAt: string;
  classification: ResultClassification;
  blockingReason: string | null;
  finalPlacement: {
    positionId: string;
    title: string;
    committeeId: string;
    committee: string;
  } | null;
  choices: ResultPreviewChoice[];
  willGenerateMemberId: boolean;
  willSendEmail: boolean;
};

type Classification = {
  classification: ResultClassification;
  blockingReason: string | null;
};

function classifyApplication(
  choices: ResultPreviewChoice[],
  finalPositionId: string | null,
): Classification {
  if (choices.length !== 2) {
    return {
      classification: "incomplete",
      blockingReason: "Application must have exactly two position choices.",
    };
  }

  if (choices.some((choice) => choice.decisionStatus === "pending")) {
    return {
      classification: "incomplete",
      blockingReason: "All committee decisions must be completed.",
    };
  }

  const approvedChoices = choices.filter(
    (choice) => choice.decisionStatus === "approved",
  );
  if (approvedChoices.length === 0) {
    if (finalPositionId) {
      return {
        classification: "incomplete",
        blockingReason:
          "Final placement must be empty when all choices are rejected.",
      };
    }
    return { classification: "rejected", blockingReason: null };
  }

  if (!finalPositionId) {
    return {
      classification: "incomplete",
      blockingReason:
        "Final placement is required after a committee approves the applicant.",
    };
  }

  if (!approvedChoices.some((choice) => choice.positionId === finalPositionId)) {
    return {
      classification: "incomplete",
      blockingReason: "Final placement must match an approved position choice.",
    };
  }

  return { classification: "accepted", blockingReason: null };
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function queryResultsPreview(
  database: typeof db | DbTransaction,
  lockRows: boolean,
) {
  const recruitmentYear = recruitmentYearInt();
  const rowsQuery = database
    .select({
      id: applications.id,
      applicationCode: applications.applicationCode,
      status: applications.status,
      finalPositionId: applications.finalPositionId,
      memberId: applications.memberId,
      resultsReleasedAt: applications.resultsReleasedAt,
      archivedAt: applications.archivedAt,
      submittedAt: applications.submittedAt,
      firstName: applicants.firstName,
      lastName: applicants.lastName,
      email: applicants.email,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(eq(applications.recruitmentYear, recruitmentYear))
    .orderBy(desc(applications.submittedAt));
  const rows = lockRows ? await rowsQuery.for("update") : await rowsQuery;

  const archived = rows.filter((row) => row.archivedAt !== null).length;
  const alreadyReleased = rows.filter(
    (row) => row.archivedAt === null && row.resultsReleasedAt !== null,
  ).length;
  const pendingRows = rows.filter(
    (row) => row.archivedAt === null && row.resultsReleasedAt === null,
  );
  const pendingIds = pendingRows.map((row) => row.id);

  const choiceQuery = database
    .select({
      applicationId: applicationChoices.applicationId,
      preferenceRank: applicationChoices.preferenceRank,
      positionId: applicationChoices.positionId,
      title: positions.name,
      committeeId: committees.id,
      committee: committees.name,
      decisionStatus: applicationChoices.decisionStatus,
    })
    .from(applicationChoices)
    .innerJoin(positions, eq(applicationChoices.positionId, positions.id))
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(inArray(applicationChoices.applicationId, pendingIds));
  const choiceRows =
    pendingIds.length === 0
      ? []
      : lockRows
        ? await choiceQuery.for("update")
        : await choiceQuery;

  const choicesByApplication = new Map<string, ResultPreviewChoice[]>();
  for (const row of choiceRows) {
    const choices = choicesByApplication.get(row.applicationId) ?? [];
    choices.push({
      preferenceRank: row.preferenceRank as 1 | 2,
      positionId: row.positionId,
      title: row.title,
      committeeId: row.committeeId,
      committee: row.committee,
      decisionStatus: row.decisionStatus,
    });
    choicesByApplication.set(row.applicationId, choices);
  }

  let accepted = 0;
  let rejected = 0;
  let incomplete = 0;
  const previewApplications: ResultPreviewApplication[] = pendingRows.map(
    (row) => {
      const choices = (choicesByApplication.get(row.id) ?? []).sort(
        (a, b) => a.preferenceRank - b.preferenceRank,
      );
      const result = classifyApplication(choices, row.finalPositionId);
      if (result.classification === "accepted") accepted += 1;
      if (result.classification === "rejected") rejected += 1;
      if (result.classification === "incomplete") incomplete += 1;

      const finalChoice = choices.find(
        (choice) => choice.positionId === row.finalPositionId,
      );

      return {
        id: row.id,
        applicationCode: row.applicationCode,
        applicant: {
          fullName: `${row.firstName} ${row.lastName}`,
          email: row.email,
        },
        applicationStatus: row.status,
        submittedAt: row.submittedAt.toISOString(),
        classification: result.classification,
        blockingReason: result.blockingReason,
        finalPlacement: finalChoice
          ? {
              positionId: finalChoice.positionId,
              title: finalChoice.title,
              committeeId: finalChoice.committeeId,
              committee: finalChoice.committee,
            }
          : null,
        choices,
        willGenerateMemberId:
          result.classification === "accepted" && row.memberId === null,
        willSendEmail: result.classification !== "incomplete",
      };
    },
  );

  return {
    recruitmentYear,
    summary: {
      pendingRelease: previewApplications.length,
      accepted,
      rejected,
      incomplete,
      alreadyReleased,
      archived,
      canRelease: previewApplications.length > 0 && incomplete === 0,
    },
    applications: previewApplications,
  };
}

export function getResultsPreview() {
  return queryResultsPreview(db, false);
}

export function getResultsPreviewForUpdate(transaction: DbTransaction) {
  return queryResultsPreview(transaction, true);
}
