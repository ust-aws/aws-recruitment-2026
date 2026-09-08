import { Hono } from "hono";
import {
  getApplicantSession,
  requireApplicantAuth,
} from "../applicant-auth";
import {
  ApplicantEditError,
  getApplicantEditableApplication,
  updateApplicantApplication,
  type UpdateApplicantApplicationInput,
} from "../lib/applicant-editing";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EDITABLE_FIELDS = new Set([
  "firstName",
  "lastName",
  "age",
  "section",
  "motivation",
  "choices",
  "slotId",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
  if ("email" in input || "documents" in input) {
    return { ok: false, error: "Email and documents cannot be changed." };
  }
  if (Object.keys(input).some((field) => !EDITABLE_FIELDS.has(field))) {
    return { ok: false, error: "The request contains a non-editable field." };
  }
  if (
    !isNonEmptyString(input.firstName) ||
    input.firstName.trim().length > 100 ||
    !isNonEmptyString(input.lastName) ||
    input.lastName.trim().length > 100 ||
    !isNonEmptyString(input.section) ||
    input.section.trim().length > 50 ||
    !isNonEmptyString(input.motivation)
  ) {
    return {
      ok: false,
      error: "firstName, lastName, section, and motivation are required.",
    };
  }
  if (!Number.isInteger(input.age) || (input.age as number) <= 0) {
    return { ok: false, error: "age must be a positive integer." };
  }
  if (!Array.isArray(input.choices) || input.choices.length !== 2) {
    return { ok: false, error: "choices must contain exactly two items." };
  }

  const choices: UpdateApplicantApplicationInput["choices"] = [];
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
    choices.push({
      positionId: row.positionId,
      preferenceRank: row.preferenceRank,
    });
  }

  if (new Set(choices.map((choice) => choice.preferenceRank)).size !== 2) {
    return { ok: false, error: "choices must include ranks 1 and 2." };
  }
  if (new Set(choices.map((choice) => choice.positionId)).size !== 2) {
    return { ok: false, error: "choices must use two different positions." };
  }
  if (
    input.slotId !== undefined &&
    (typeof input.slotId !== "string" || !UUID_RE.test(input.slotId))
  ) {
    return { ok: false, error: "slotId must be a UUID." };
  }

  return {
    ok: true,
    value: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      age: input.age as number,
      section: input.section.trim(),
      motivation: input.motivation.trim(),
      choices,
      ...(typeof input.slotId === "string" ? { slotId: input.slotId } : {}),
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
