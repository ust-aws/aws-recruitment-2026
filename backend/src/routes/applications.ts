import { Hono } from "hono";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  positionsExist,
  updateApplicationStatus,
  type CreateApplicationInput,
  type DocumentType,
} from "../lib/applications";
import { requireAuth } from "../auth";

export const applicationsRoutes = new Hono();

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
  if (
    !isNonEmptyString(input.firstName) ||
    !isNonEmptyString(input.lastName) ||
    !isNonEmptyString(input.email) ||
    !isNonEmptyString(input.section) ||
    !isNonEmptyString(input.motivation)
  ) {
    return {
      ok: false,
      error: "firstName, lastName, email, section, and motivation are required.",
    };
  }

  if (!Number.isInteger(input.age) || (input.age as number) <= 0) {
    return { ok: false, error: "age must be a positive integer." };
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

  if (!Array.isArray(input.documents) || input.documents.length !== 2) {
    return { ok: false, error: "documents must contain resume and transcript." };
  }

  const documents: CreateApplicationInput["documents"] = [];
  const types = new Set<DocumentType>();
  for (const doc of input.documents) {
    if (!doc || typeof doc !== "object") {
      return { ok: false, error: "Each document must be an object." };
    }
    const row = doc as Record<string, unknown>;
    if (row.documentType !== "resume" && row.documentType !== "transcript") {
      return {
        ok: false,
        error: "documentType must be resume or transcript.",
      };
    }
    if (!isNonEmptyString(row.fileName) || !isNonEmptyString(row.s3Key)) {
      return {
        ok: false,
        error: "Each document needs a fileName and non-empty s3Key.",
      };
    }
    types.add(row.documentType);
    documents.push({
      documentType: row.documentType,
      fileName: row.fileName.trim(),
      s3Key: row.s3Key.trim(),
    });
  }

  if (types.size !== 2) {
    return {
      ok: false,
      error: "documents must include one resume and one transcript.",
    };
  }

  return {
    ok: true,
    value: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      age: input.age as number,
      section: input.section.trim(),
      motivation: input.motivation.trim(),
      choices,
      documents,
    },
  };
}

applicationsRoutes.get("/", requireAuth, async (c) => {
  const committee = c.req.query("committee") ?? "";
  const position = c.req.query("position") ?? "";
  const section = c.req.query("section") ?? "";

  if (committee && !isUuid(committee)) {
    return c.json({ error: "committee must be a UUID." }, 400);
  }
  if (position && !isUuid(position)) {
    return c.json({ error: "position must be a UUID." }, 400);
  }

  const result = await listApplications({
    committee: committee || undefined,
    position: position || undefined,
    section: section || undefined,
  });
  return c.json(result);
});

applicationsRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  const known = await positionsExist(
    parsed.value.choices.map((choice) => choice.positionId),
  );
  if (!known) {
    return c.json({ error: "One or more positions do not exist." }, 400);
  }

  const created = await createApplication(parsed.value);
  return c.json(created, 201);
});

applicationsRoutes.patch("/:id/status", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const status =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).status
      : undefined;
  if (status !== "approved" && status !== "rejected") {
    return c.json({ error: "status must be approved or rejected." }, 400);
  }

  const updated = await updateApplicationStatus(id, status);
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

applicationsRoutes.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const deleted = await deleteApplication(id);
  if (!deleted) {
    return c.json({ error: "Application not found." }, 404);
  }
  return c.body(null, 204);
});
