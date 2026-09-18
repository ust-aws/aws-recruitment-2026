import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  getInterviewWindowPayload,
  InterviewWindowError,
  upsertInterviewWindow,
} from "../lib/interview/window";
import { logHrAudit } from "../lib/hr/audit";
import {
  interviewWindowPatchSchema,
  zodErrorMessage,
} from "../lib/hr/schemas";

export const interviewWindowRoutes = new Hono();

interviewWindowRoutes.get("/", async (c) => {
  return c.json(await getInterviewWindowPayload());
});

interviewWindowRoutes.patch("/", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = interviewWindowPatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  try {
    const payload = c.get("jwtPayload") as { sub?: unknown };
    const email = typeof payload.sub === "string" ? payload.sub : undefined;
    const result = await upsertInterviewWindow(startsAt, endsAt, email);
    logHrAudit({
      actorEmail: email,
      action: "interview_window.update",
      resourceType: "interview_window",
    });
    return c.json(result);
  } catch (error) {
    if (error instanceof InterviewWindowError) {
      const status = error.code === "invalid_range" ? 409 : 400;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});
