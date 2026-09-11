import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  getInterviewWindowPayload,
  InterviewWindowError,
  upsertInterviewWindow,
} from "../lib/interview-window";

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  if (!value.includes("T") || !/(Z|[+-][0-9]{2}:[0-9]{2})$/.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const interviewWindowRoutes = new Hono();

interviewWindowRoutes.get("/", async (c) => {
  return c.json(await getInterviewWindowPayload());
});

interviewWindowRoutes.patch("/", requireAuth, async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const startsAt = parseTimestamp(body?.startsAt);
  const endsAt = parseTimestamp(body?.endsAt);
  if (!startsAt || !endsAt) {
    return c.json(
      {
        error: "startsAt and endsAt must be ISO timestamps with a timezone.",
      },
      400,
    );
  }

  try {
    const payload = c.get("jwtPayload") as { sub?: unknown };
    const email = typeof payload.sub === "string" ? payload.sub : undefined;
    return c.json(await upsertInterviewWindow(startsAt, endsAt, email));
  } catch (error) {
    if (error instanceof InterviewWindowError) {
      const status = error.code === "invalid_range" ? 409 : 400;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});
