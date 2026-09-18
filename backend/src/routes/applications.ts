import { Hono } from "hono";
import {
  ApplicationAlreadySubmittedError,
  choiceRefsForPositions,
  createApplication,
  getApplicationDocument,
  getApplicationById,
  listApplications,
  positionsExist,
  setApplicationArchived,
  deleteArchivedApplication,
  DeleteArchivedApplicationError,
  type CreateApplicationInput,
} from "../lib/applications/applications";
import {
  ApplicationDecisionError,
  updateApplicationDecision,
  type ChoiceDecisionStatus,
} from "../lib/applications/application-decisions";
import { validateChoiceUrls } from "../lib/apply/field-validation";
import { createApplicationSchema } from "../lib/apply/schemas";
import { requireAuth } from "../auth";
import { createDocumentDownload } from "../lib/applications/documents";
import { freePlanEndDate } from "../lib/core/free-plan";
import {
  listEmailNotificationsByApplicationId,
  sendApplicationSubmitted,
  sendMemberRegistration,
  sendOfficerApplicationNotice,
} from "../lib/email/service";
import { InterviewScheduleError } from "../lib/interview/scheduling";
import { resolveRecruitmentSeasonStatus } from "../lib/recruitment/window";
import {
  applicationArchivePatchSchema,
  applicationDecisionPatchSchema,
  zodErrorMessage,
} from "../lib/hr/schemas";
import { logHrAudit } from "../lib/hr/audit";
import { internalApiError, logApiError } from "../lib/core/api-errors";

export const applicationsRoutes = new Hono();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  max?: number,
): number | null {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || (max && parsed > max)) {
    return null;
  }
  return parsed;
}

function parseCreateBody(
  body: unknown,
): { ok: true; value: CreateApplicationInput } | { ok: false; error: string } {
  const result = createApplicationSchema.safeParse(body);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: result.error.issues[0].message };
}

applicationsRoutes.get("/", requireAuth, async (c) => {
  const committee = c.req.query("committee") ?? "";
  const committeeName = (c.req.query("committeeName") ?? "").trim();
  const position = c.req.query("position") ?? "";
  const section = c.req.query("section") ?? "";
  const query = (c.req.query("query") ?? "").trim();
  const status = c.req.query("status") ?? "";
  const applicationType = c.req.query("applicationType") ?? "";
  const archive = c.req.query("archive") ?? "active";
  const page = parsePositiveInteger(c.req.query("page"), 1);
  const pageSize = parsePositiveInteger(c.req.query("pageSize"), 10, 100);

  if (committee && !isUuid(committee)) {
    return c.json({ error: "committee must be a UUID." }, 400);
  }
  if (committeeName.length > 100) {
    return c.json({ error: "committeeName must be at most 100 characters." }, 400);
  }
  if (position && !isUuid(position)) {
    return c.json({ error: "position must be a UUID." }, 400);
  }
  if (query.length > 200) {
    return c.json({ error: "query must be at most 200 characters." }, 400);
  }
  if (
    status &&
    !["pending", "approved", "rejected"].includes(status)
  ) {
    return c.json(
      { error: "status must be pending, approved, or rejected." },
      400,
    );
  }
  if (applicationType && !["position", "member"].includes(applicationType)) {
    return c.json(
      { error: "applicationType must be position or member." },
      400,
    );
  }
  if (!["active", "archived", "all"].includes(archive)) {
    return c.json(
      { error: "archive must be active, archived, or all." },
      400,
    );
  }
  if (page === null) {
    return c.json({ error: "page must be a positive integer." }, 400);
  }
  if (pageSize === null) {
    return c.json(
      { error: "pageSize must be an integer between 1 and 100." },
      400,
    );
  }

  const result = await listApplications({
    committee: committee || undefined,
    committeeName: committeeName || undefined,
    position: position || undefined,
    section: section || undefined,
    query: query || undefined,
    status: status
      ? (status as "pending" | "approved" | "rejected")
      : undefined,
    applicationType: applicationType
      ? (applicationType as "position" | "member")
      : undefined,
    archive: archive as "active" | "archived" | "all",
    page,
    pageSize,
  });
  return c.json(result);
});

applicationsRoutes.post("/", async (c) => {
  const season = await resolveRecruitmentSeasonStatus();
  if (!season.open) {
    return c.json({ error: season.message ?? "Applications are closed." }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  if (parsed.value.applicationType === "position") {
    const positionIds = parsed.value.choices.map((choice) => choice.positionId);
    const known = await positionsExist(positionIds);
    if (!known) {
      return c.json({ error: "One or more positions do not exist." }, 400);
    }

    const choiceRefs = await choiceRefsForPositions(positionIds);
    const urlError = validateChoiceUrls(
      choiceRefs,
      parsed.value.portfolioUrl,
      parsed.value.githubUrl,
    );
    if (urlError) {
      return c.json({ error: urlError }, 400);
    }
  }

  try {
    const result = await createApplication(parsed.value);
    if (result.created) {
      if (result.application.applicationType === "member") {
        await sendMemberRegistration(result.application).catch((err) => {
          logApiError(c, err, "membership registration email failed");
        });
      } else {
        await Promise.all([
          sendApplicationSubmitted(result.application).catch((err) => {
            logApiError(c, err, "submission email failed");
          }),
          sendOfficerApplicationNotice(result.application).catch((err) => {
            logApiError(c, err, "officer application notice failed");
          }),
        ]);
      }
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
    return internalApiError(
      c,
      error,
      "Could not create application",
      "Could not create application.",
    );
  }
});

applicationsRoutes.patch("/:id/decisions", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = applicationDecisionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const changesChoice =
    parsed.data.positionId !== undefined &&
    parsed.data.decisionStatus !== undefined;
  const changesFinalPlacement = parsed.data.finalPositionId !== undefined;

  const payload = c.get("jwtPayload") as { sub?: unknown };
  const reviewerEmail =
    typeof payload.sub === "string" ? payload.sub : undefined;
  try {
    const updated = await updateApplicationDecision(
      id,
      {
        ...(changesChoice
          ? {
              positionId: parsed.data.positionId as string,
              decisionStatus: parsed.data.decisionStatus as ChoiceDecisionStatus,
            }
          : {}),
        ...(changesFinalPlacement
          ? { finalPositionId: parsed.data.finalPositionId as string | null }
          : {}),
      },
      reviewerEmail,
    );
    if (!updated) {
      return c.json({ error: "Application not found." }, 404);
    }
    logHrAudit({
      actorEmail: reviewerEmail,
      action: "application.decision",
      resourceType: "application",
      resourceId: id,
    });
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

  const body = await c.req.json().catch(() => null);
  const parsed = applicationArchivePatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const payload = c.get("jwtPayload") as { sub?: unknown };
  const reviewerEmail =
    typeof payload.sub === "string" ? payload.sub : undefined;
  const updated = await setApplicationArchived(
    id,
    parsed.data.archived,
    reviewerEmail,
  );
  if (!updated) {
    return c.json({ error: "Application not found." }, 404);
  }
  logHrAudit({
    actorEmail: reviewerEmail,
    action: parsed.data.archived ? "application.archive" : "application.unarchive",
    resourceType: "application",
    resourceId: id,
  });
  return c.json(updated);
});

applicationsRoutes.delete("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid application id." }, 400);
  }

  const payload = c.get("jwtPayload") as { sub?: unknown };
  const reviewerEmail =
    typeof payload.sub === "string" ? payload.sub : undefined;

  try {
    await deleteArchivedApplication(id);
  } catch (error) {
    if (error instanceof DeleteArchivedApplicationError) {
      const status = error.code === "not_found" ? 404 : 409;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }

  logHrAudit({
    actorEmail: reviewerEmail,
    action: "application.delete",
    resourceType: "application",
    resourceId: id,
  });
  return c.body(null, 204);
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
    return internalApiError(
      c,
      error,
      "Could not load application document",
      "Document storage is unavailable.",
    );
  }
});
