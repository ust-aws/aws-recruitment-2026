import { Hono } from "hono";
import {
  getApplicantSession,
  requireApplicantAuth,
} from "../applicant-auth";
import {
  bookApplicantInterview,
  getApplicantInterviewSchedule,
  InterviewScheduleError,
} from "../lib/interview-scheduling";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function schedulingError(error: unknown) {
  if (!(error instanceof InterviewScheduleError)) throw error;
  const status =
    error.code === "application_not_found" ||
    error.code === "position_not_found" ||
    error.code === "slot_not_found"
      ? 404
      : 409;
  return { body: { error: error.message }, status } as const;
}

export const applicantInterviewRoutes = new Hono();

applicantInterviewRoutes.use("*", requireApplicantAuth);

applicantInterviewRoutes.get("/interview-slots", async (c) => {
  const positionId = c.req.query("positionId");
  if (positionId && !isUuid(positionId)) {
    return c.json({ error: "positionId must be a UUID." }, 400);
  }

  const session = getApplicantSession(c);
  try {
    const schedule = await getApplicantInterviewSchedule(
      session.applicationId,
      positionId || undefined,
    );
    return c.json(schedule);
  } catch (error) {
    const result = schedulingError(error);
    return c.json(result.body, result.status);
  }
});

applicantInterviewRoutes.put("/interview-booking", async (c) => {
  const body = await c.req.json().catch(() => null);
  const slotId =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).slotId
      : undefined;
  if (typeof slotId !== "string" || !isUuid(slotId)) {
    return c.json({ error: "slotId must be a UUID." }, 400);
  }

  const session = getApplicantSession(c);
  try {
    const booking = await bookApplicantInterview(
      session.applicationId,
      slotId,
    );
    return c.json({ booking });
  } catch (error) {
    const result = schedulingError(error);
    return c.json(result.body, result.status);
  }
});
