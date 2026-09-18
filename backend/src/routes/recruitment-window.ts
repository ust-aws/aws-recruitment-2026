import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  getRecruitmentWindowPayload,
  RecruitmentWindowError,
  upsertRecruitmentWindow,
} from "../lib/recruitment/window";
import { logHrAudit } from "../lib/hr/audit";
import {
  recruitmentWindowPatchSchema,
  zodErrorMessage,
} from "../lib/hr/schemas";

export const recruitmentWindowRoutes = new Hono();

recruitmentWindowRoutes.get("/", async (c) => {
  return c.json(await getRecruitmentWindowPayload());
});

recruitmentWindowRoutes.patch("/", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = recruitmentWindowPatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  try {
    const payload = c.get("jwtPayload") as { sub?: unknown };
    const email = typeof payload.sub === "string" ? payload.sub : undefined;
    const result = await upsertRecruitmentWindow(startsAt, endsAt, email);
    logHrAudit({
      actorEmail: email,
      action: "recruitment_window.update",
      resourceType: "recruitment_window",
    });
    return c.json(result);
  } catch (error) {
    if (error instanceof RecruitmentWindowError) {
      const status = error.code === "invalid_range" ? 409 : 400;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});
