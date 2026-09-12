import { Hono } from "hono";
import {
  ApplicationAlreadySubmittedError,
  committeeNamesForPositions,
  createApplication,
  getApplicationDocument,
  getApplicationById,
  listApplications,
  positionsExist,
  setApplicationArchived,
  type CreateApplicationInput,
} from "../lib/applications";
import {
  ApplicationDecisionError,
  updateApplicationDecision,
  type ChoiceDecisionStatus,
} from "../lib/application-decisions";
import {
  canonicalizeHttpsUrl,
  hasValidLastNameFileToken,
  isValidApplicantName,
  isValidContactNumber,
  isValidFacebookUrl,
  isValidMotivation,
  isValidSection,
  isValidStudentNumber,
  isValidUstApplicantEmail,
  normalizeSection,
  validateChoiceUrls,
} from "../lib/apply-field-validation";
import { requireAuth } from "../auth";
import { createDocumentDownload } from "../lib/documents";
import { freePlanEndDate } from "../lib/free-plan";
import {
  listEmailNotificationsByApplicationId,
  sendApplicationSubmitted,
} from "../lib/email/service";
import { parseApplicantGender } from "../lib/applicant-gender";
import { InterviewScheduleError } from "../lib/interview-scheduling";

export const applicationsRoutes = new Hono();

const BIRTHDAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseBirthday(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  const trimmed = value.trim();
  if (!BIRTHDAY_RE.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return null;
  return trimmed;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCreateBody(
  body: unknown,
): { ok: true; value: CreateApplicationInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const input = body as Record<string, unknown>;
  if (input.dataPrivacyAgreed !== true) {
    return {
      ok: false,
      error: "dataPrivacyAgreed must be true before submitting.",
    };
  }

  if (
    !isNonEmptyString(input.firstName) ||
    !isNonEmptyString(input.lastName) ||
    !isNonEmptyString(input.email) ||
    !isNonEmptyString(input.section) ||
    !isNonEmptyString(input.motivation) ||
    !isNonEmptyString(input.studentNumber) ||
    !isNonEmptyString(input.contactNumber) ||
    !isNonEmptyString(input.facebookUrl)
  ) {
    return {
      ok: false,
      error:
        "firstName, lastName, email, section, studentNumber, contactNumber, facebookUrl, and motivation are required.",
    };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const motivation = input.motivation.trim();

  if (!isValidApplicantName(firstName) || !isValidApplicantName(lastName)) {
    return {
      ok: false,
      error: "firstName and lastName must use letters only (max 100 characters).",
    };
  }
  if (!hasValidLastNameFileToken(lastName)) {
    return {
      ok: false,
      error: "lastName must include at least one letter for document file names.",
    };
  }
  if (!isValidUstApplicantEmail(email)) {
    return {
      ok: false,
      error: "email must be a valid @ust.edu.ph address.",
    };
  }
  if (!isValidMotivation(motivation)) {
    return {
      ok: false,
      error: "motivation is required and must be at most 4000 characters.",
    };
  }

  const section = normalizeSection(input.section);
  if (!isValidSection(section)) {
    return {
      ok: false,
      error: "section must be four characters: year digit plus three letters (e.g. 4CSC).",
    };
  }

  if (!isValidStudentNumber(input.studentNumber)) {
    return { ok: false, error: "studentNumber must be exactly 10 digits." };
  }

  const contactNumber = input.contactNumber.trim();
  if (!isValidContactNumber(contactNumber)) {
    return {
      ok: false,
      error: "contactNumber must be +63 followed by 10 digits.",
    };
  }

  const facebookCanonical = canonicalizeHttpsUrl(input.facebookUrl.trim());
  if (!facebookCanonical || !isValidFacebookUrl(facebookCanonical)) {
    return {
      ok: false,
      error: "facebookUrl must be a valid https Facebook profile link.",
    };
  }

  const portfolioUrl =
    typeof input.portfolioUrl === "string" ? input.portfolioUrl.trim() : "";
  const githubUrl =
    typeof input.githubUrl === "string" ? input.githubUrl.trim() : "";

  if (!Number.isInteger(input.age) || (input.age as number) <= 0) {
    return { ok: false, error: "age must be a positive integer." };
  }

  const birthday = parseBirthday(input.birthday);
  if (!birthday) {
    return {
      ok: false,
      error: "birthday must be a valid date (YYYY-MM-DD) that is not in the future.",
    };
  }

  const gender = parseApplicantGender(input.gender);
  if (!gender) {
    return {
      ok: false,
      error:
        "gender must be one of: male, female.",
    };
  }

  if (!Array.isArray(input.choices) || input.choices.length !== 2) {
    return { ok: false, error: "choices must contain exactly two items." };
  }

  const choices: CreateApplicationInput["choices"] = [];
  for (const choice of input.choices) {
    if (!choice || typeof choice !== "object") {
      return { ok: false, error: "Each choice must be an object." };
    }
    const row = choice as Record<string, unknown>;
    if (!isNonEmptyString(row.positionId) || !isUuid(row.positionId)) {
      return { ok: false, error: "Each choice needs a valid positionId UUID." };
    }
    if (row.preferenceRank !== 1 && row.preferenceRank !== 2) {
      return { ok: false, error: "preferenceRank must be 1 or 2." };
    }
    choices.push({
      positionId: row.positionId,
      preferenceRank: row.preferenceRank,
    });
  }

  const ranks = new Set(choices.map((choice) => choice.preferenceRank));
  if (ranks.size !== 2) {
    return { ok: false, error: "choices must include ranks 1 and 2." };
  }
  if (choices[0].positionId === choices[1].positionId) {
    return { ok: false, error: "choices must use two different positions." };
  }

  if (!isNonEmptyString(input.uploadSessionId) || !isUuid(input.uploadSessionId)) {
    return { ok: false, error: "uploadSessionId must be a valid UUID." };
  }

  if (!isNonEmptyString(input.slotId) || !isUuid(input.slotId as string)) {
    return { ok: false, error: "slotId must be a UUID." };
  }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      age: input.age as number,
      birthday,
      gender,
      section,
      studentNumber: input.studentNumber.trim(),
      contactNumber,
      facebookUrl: facebookCanonical,
      motivation,
      dataPrivacyAgreed: true,
      ...(portfolioUrl ? { portfolioUrl } : {}),
      ...(githubUrl ? { githubUrl } : {}),
      slotId: (input.slotId as string).trim(),
      choices,
      uploadSessionId: input.uploadSessionId,
    },
  };
}

applicationsRoutes.get("/", requireAuth, async (c) => {
  const committee = c.req.query("committee") ?? "";
  const position = c.req.query("position") ?? "";
  const section = c.req.query("section") ?? "";
  const archive = c.req.query("archive") ?? "active";

  if (committee && !isUuid(committee)) {
    return c.json({ error: "committee must be a UUID." }, 400);
  }
  if (position && !isUuid(position)) {
    return c.json({ error: "position must be a UUID." }, 400);
  }
  if (!["active", "archived", "all"].includes(archive)) {
    return c.json(
      { error: "archive must be active, archived, or all." },
      400,
    );
  }

  const result = await listApplications({
    committee: committee || undefined,
    position: position || undefined,
    section: section || undefined,
    archive: archive as "active" | "archived" | "all",
  });
  return c.json(result);
});

applicationsRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  const positionIds = parsed.value.choices.map((choice) => choice.positionId);
  const known = await positionsExist(positionIds);
  if (!known) {
    return c.json({ error: "One or more positions do not exist." }, 400);
  }

  const committeeNames = await committeeNamesForPositions(positionIds);
  const urlError = validateChoiceUrls(
    committeeNames,
    parsed.value.portfolioUrl,
    parsed.value.githubUrl,
  );
  if (urlError) {
    return c.json({ error: urlError }, 400);
  }

  try {
    const result = await createApplication(parsed.value);
    if (result.created) {
      void sendApplicationSubmitted(result.application).catch((err) => {
        console.error("submission email failed", err);
      });
    }
    return c.json(result.application, result.created ? 201 : 200);
  } catch (error) {
    if (error instanceof ApplicationAlreadySubmittedError) {
      return c.json({ error: error.message }, 409);
    }
    if (error instanceof InterviewScheduleError) {
      const status =
        error.code === "slot_not_found" || error.code === "position_not_found"
          ? 404
          : 409;
      return c.json({ error: error.message }, status);
    }
    const message = error instanceof Error ? error.message : "Could not create application.";
    if (message.includes("was not found")) return c.json({ error: message }, 404);
    if (message.includes("has expired")) return c.json({ error: message }, 410);
    if (message.includes("metadata") || message.includes("not a PDF")) {
      return c.json({ error: message }, 400);
    }
    console.error("Could not create application", error);
    return c.json({ error: "Could not create application." }, 503);
  }
});

applicationsRoutes.patch("/:id/decisions", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const body = (await c.req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const hasPositionId = Object.hasOwn(body, "positionId");
  const hasDecisionStatus = Object.hasOwn(body, "decisionStatus");
  const changesChoice = hasPositionId && hasDecisionStatus;
  const changesFinalPlacement = Object.hasOwn(body, "finalPositionId");
  if (hasPositionId !== hasDecisionStatus) {
    return c.json(
      { error: "positionId and decisionStatus must be provided together." },
      400,
    );
  }
  if (!changesChoice && !changesFinalPlacement) {
    return c.json(
      { error: "Provide a committee decision or finalPositionId." },
      400,
    );
  }
  if (
    changesChoice &&
    (!isNonEmptyString(body.positionId) ||
      !isUuid(body.positionId) ||
      (body.decisionStatus !== "approved" &&
        body.decisionStatus !== "rejected"))
  ) {
    return c.json(
      {
        error:
          "positionId must be a UUID and decisionStatus must be approved or rejected.",
      },
      400,
    );
  }
  if (
    changesFinalPlacement &&
    body.finalPositionId !== null &&
    (!isNonEmptyString(body.finalPositionId) ||
      !isUuid(body.finalPositionId))
  ) {
    return c.json(
      { error: "finalPositionId must be a UUID or null." },
      400,
    );
  }

  const payload = c.get("jwtPayload") as { sub?: unknown };
  const reviewerEmail =
    typeof payload.sub === "string" ? payload.sub : undefined;
  try {
    const updated = await updateApplicationDecision(
      id,
      {
        ...(changesChoice
          ? {
              positionId: body.positionId as string,
              decisionStatus: body.decisionStatus as ChoiceDecisionStatus,
            }
          : {}),
        ...(changesFinalPlacement
          ? { finalPositionId: body.finalPositionId as string | null }
          : {}),
      },
      reviewerEmail,
    );
    if (!updated) {
      return c.json({ error: "Application not found." }, 404);
    }
    return c.json(updated);
  } catch (error) {
    if (error instanceof ApplicationDecisionError) {
      const status =
        error.code === "application_not_found" ||
        error.code === "choice_not_found"
          ? 404
          : 409;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});

applicationsRoutes.get("/:id/email-notifications", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const application = await getApplicationById(id);
  if (!application) {
    return c.json({ error: "Application not found." }, 404);
  }

  const notifications = await listEmailNotificationsByApplicationId(id);
  return c.json({ notifications });
});

applicationsRoutes.patch("/:id/archive", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const body = (await c.req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body || typeof body.archived !== "boolean") {
    return c.json({ error: "archived must be a boolean." }, 400);
  }

  const payload = c.get("jwtPayload") as { sub?: unknown };
  const reviewerEmail =
    typeof payload.sub === "string" ? payload.sub : undefined;
  const updated = await setApplicationArchived(
    id,
    body.archived,
    reviewerEmail,
  );
  if (!updated) {
    return c.json({ error: "Application not found." }, 404);
  }
  return c.json(updated);
});

applicationsRoutes.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const application = await getApplicationById(id);
  if (!application) {
    return c.json({ error: "Application not found." }, 404);
  }
  return c.json(application);
});

applicationsRoutes.get("/:id/documents/:type", requireAuth, async (c) => {
  const id = c.req.param("id");
  const type = c.req.param("type");
  if (!isUuid(id)) return c.json({ error: "Invalid application id." }, 400);
  if (type !== "resume" && type !== "transcript" && type !== "registration") {
    return c.json(
      { error: "Document type must be resume, transcript, or registration." },
      400,
    );
  }
  const document = await getApplicationDocument(id, type);
  if (!document) return c.json({ error: "Document not found." }, 404);
  const availableUntil = document.availableUntil ?? freePlanEndDate();
  if (availableUntil && availableUntil <= new Date()) {
    return c.json({ error: "Document files have expired." }, 410);
  }
  const disposition = c.req.query("disposition") ?? "inline";
  if (disposition !== "inline" && disposition !== "attachment") {
    return c.json({ error: "disposition must be inline or attachment." }, 400);
  }
  try {
    const url = await createDocumentDownload(
      document.s3Key,
      document.fileName,
      disposition,
    );
    c.header("Cache-Control", "no-store");
    return c.redirect(url, 302);
  } catch (error) {
    console.error("Could not load application document", error);
    return c.json({ error: "Document storage is unavailable." }, 503);
  }
});
