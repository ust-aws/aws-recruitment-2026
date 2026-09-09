import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  getRecruitmentWindowPayload,
  RecruitmentWindowError,
  upsertRecruitmentWindow,
} from "../lib/recruitment-window";

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  if (!value.includes("T") || !/(Z|[+-][0-9]{2}:[0-9]{2})$/.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const recruitmentWindowRoutes = new Hono();

recruitmentWindowRoutes.use("*", requireAuth);

recruitmentWindowRoutes.get("/", async (c) => {
  return c.json(await getRecruitmentWindowPayload());
});

recruitmentWindowRoutes.patch("/", async (c) => {
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
    return c.json(await upsertRecruitmentWindow(startsAt, endsAt, email));
  } catch (error) {
    if (error instanceof RecruitmentWindowError) {
      const status = error.code === "invalid_range" ? 409 : 400;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});
