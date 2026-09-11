import { Hono } from "hono";
import {
  getApplicantSession,
  requireApplicantAuth,
} from "../applicant-auth";
import {
  ApplicantEditError,
  getApplicantEditableApplication,
  updateApplicantApplication,
  type ApplicantDocumentInput,
  type UpdateApplicantApplicationInput,
} from "../lib/applicant-editing";
import type { DocumentType } from "../lib/applications";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EDITABLE_FIELDS = new Set([
  "choices",
  "slotId",
  "portfolioUrl",
  "githubUrl",
  "documents",
]);

function parseDocuments(
  value: unknown,
): { ok: true; value: ApplicantDocumentInput[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0 || value.length > 3) {
    return {
      ok: false,
      error: "documents must contain one to three items.",
    };
  }

  const documents: ApplicantDocumentInput[] = [];
  const types = new Set<DocumentType>();

  for (const doc of value) {
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
      return { ok: false, error: "Each document must be an object." };
    }
    const row = doc as Record<string, unknown>;
    if (
      row.documentType !== "resume" &&
      row.documentType !== "transcript" &&
      row.documentType !== "registration"
    ) {
      return {
        ok: false,
        error: "documentType must be resume, transcript, or registration.",
      };
    }
    const documentType = row.documentType as DocumentType;
    if (types.has(documentType)) {
      return { ok: false, error: "Each document type may only appear once." };
    }
    types.add(documentType);

    if (
      typeof row.fileName !== "string" ||
      !row.fileName.trim() ||
      typeof row.s3Key !== "string" ||
      !row.s3Key.trim()
    ) {
      return {
        ok: false,
        error: "Each document needs a fileName and non-empty s3Key.",
      };
    }

    documents.push({
      documentType,
      fileName: row.fileName.trim(),
      s3Key: row.s3Key.trim(),
    });
  }

  return { ok: true, value: documents };
}

function parseEditBody(
  body: unknown,
):
  | { ok: true; value: UpdateApplicantApplicationInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const input = body as Record<string, unknown>;
  if ("email" in input) {
    return { ok: false, error: "Email and documents cannot be changed." };
  }
  if (
    "firstName" in input ||
    "lastName" in input ||
    "age" in input ||
    "birthday" in input ||
    "gender" in input ||
    "section" in input ||
    "motivation" in input
  ) {
    return {
      ok: false,
      error: "Only committee choices can be changed.",
    };
  }
  if (Object.keys(input).some((field) => !EDITABLE_FIELDS.has(field))) {
    return { ok: false, error: "The request contains a non-editable field." };
  }

  const hasChoices = input.choices !== undefined;
  const hasDocuments = input.documents !== undefined;

  if (!hasChoices && !hasDocuments) {
    return {
      ok: false,
      error: "The request must include choices or documents to update.",
    };
  }

  let documents: ApplicantDocumentInput[] | undefined;
  if (hasDocuments) {
    const parsedDocuments = parseDocuments(input.documents);
    if (!parsedDocuments.ok) {
      return parsedDocuments;
    }
    documents = parsedDocuments.value;
  }

  let choices: UpdateApplicantApplicationInput["choices"];
  if (hasChoices) {
    if (!Array.isArray(input.choices) || input.choices.length !== 2) {
      return { ok: false, error: "choices must contain exactly two items." };
    }

    const parsedChoices: NonNullable<
      UpdateApplicantApplicationInput["choices"]
    > = [];
    for (const choice of input.choices) {
      if (!choice || typeof choice !== "object" || Array.isArray(choice)) {
        return { ok: false, error: "Each choice must be an object." };
      }
      const row = choice as Record<string, unknown>;
      if (
        typeof row.positionId !== "string" ||
        !UUID_RE.test(row.positionId)
      ) {
        return { ok: false, error: "Each choice needs a positionId UUID." };
      }
      if (row.preferenceRank !== 1 && row.preferenceRank !== 2) {
        return { ok: false, error: "preferenceRank must be 1 or 2." };
      }
      parsedChoices.push({
        positionId: row.positionId,
        preferenceRank: row.preferenceRank,
      });
    }

    if (new Set(parsedChoices.map((choice) => choice.preferenceRank)).size !== 2) {
      return { ok: false, error: "choices must include ranks 1 and 2." };
    }
    if (new Set(parsedChoices.map((choice) => choice.positionId)).size !== 2) {
      return { ok: false, error: "choices must use two different positions." };
    }
    choices = parsedChoices;
  }

  if (
    input.slotId !== undefined &&
    (typeof input.slotId !== "string" || !UUID_RE.test(input.slotId))
  ) {
    return { ok: false, error: "slotId must be a UUID." };
  }

  const portfolioUrl =
    input.portfolioUrl === undefined
      ? undefined
      : typeof input.portfolioUrl === "string"
        ? input.portfolioUrl
        : null;
  if (portfolioUrl === null) {
    return { ok: false, error: "portfolioUrl must be a string." };
  }

  const githubUrl =
    input.githubUrl === undefined
      ? undefined
      : typeof input.githubUrl === "string"
        ? input.githubUrl
        : null;
  if (githubUrl === null) {
    return { ok: false, error: "githubUrl must be a string." };
  }

  if (choices === undefined && (input.slotId || portfolioUrl !== undefined || githubUrl !== undefined)) {
    return {
      ok: false,
      error: "choices must contain exactly two items.",
    };
  }

  return {
    ok: true,
    value: {
      ...(choices ? { choices } : {}),
      ...(typeof input.slotId === "string" ? { slotId: input.slotId } : {}),
      ...(portfolioUrl !== undefined ? { portfolioUrl } : {}),
      ...(githubUrl !== undefined ? { githubUrl } : {}),
      ...(documents ? { documents } : {}),
    },
  };
}

function editError(error: unknown) {
  if (!(error instanceof ApplicantEditError)) throw error;
  const status =
    error.code === "editing_unavailable"
      ? 503
      : error.code === "application_not_found" ||
          error.code === "slot_not_found"
        ? 404
        : 409;
  return { body: { error: error.message }, status } as const;
}

export const applicantApplicationRoutes = new Hono();

applicantApplicationRoutes.use("*", requireApplicantAuth);

applicantApplicationRoutes.get("/application", async (c) => {
  const session = getApplicantSession(c);
  const application = await getApplicantEditableApplication(
    session.applicationId,
  );
  if (!application) {
    return c.json({ error: "Application not found." }, 404);
  }
  return c.json(application);
});

applicantApplicationRoutes.patch("/application", async (c) => {
  const parsed = parseEditBody(await c.req.json().catch(() => null));
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  const session = getApplicantSession(c);
  try {
    const application = await updateApplicantApplication(
      session.applicationId,
      parsed.value,
    );
    return c.json(application);
  } catch (error) {
    const result = editError(error);
    return c.json(result.body, result.status);
  }
});
