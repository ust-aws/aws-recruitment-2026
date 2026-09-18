import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  createInterviewSlot,
  InterviewScheduleError,
  listInterviewSlotsForHr,
  resetInterviewScheduleForCommittee,
  setInterviewSlotOpen,
} from "../lib/interview/scheduling";
import {
  interviewSlotCreateSchema,
  interviewSlotPatchSchema,
  zodErrorMessage,
} from "../lib/hr/schemas";
import { logHrAudit } from "../lib/hr/audit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parseDate(value: string | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value.includes("T") || !/(Z|[+-][0-9]{2}:[0-9]{2})$/.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function schedulingError(error: unknown) {
  if (!(error instanceof InterviewScheduleError)) throw error;
  const status =
    error.code === "committee_not_found" || error.code === "slot_not_found"
      ? 404
      : 409;
  return { body: { error: error.message }, status } as const;
}

export const interviewSlotsRoutes = new Hono();

interviewSlotsRoutes.use("*", requireAuth);

interviewSlotsRoutes.get("/", async (c) => {
  const committeeId = c.req.query("committeeId");
  if (committeeId && !isUuid(committeeId)) {
    return c.json({ error: "committeeId must be a UUID." }, 400);
  }

  const from = parseDate(c.req.query("from"));
  const to = parseDate(c.req.query("to"));
  if (from === null || to === null) {
    return c.json(
      { error: "from and to must be ISO timestamps with a timezone." },
      400,
    );
  }
  if (from && to && from >= to) {
    return c.json({ error: "from must be earlier than to." }, 400);
  }

  const slots = await listInterviewSlotsForHr({ committeeId, from, to });
  return c.json({ slots });
});

interviewSlotsRoutes.delete("/", async (c) => {
  const committeeId = c.req.query("committeeId");
  if (!committeeId || !isUuid(committeeId)) {
    return c.json({ error: "committeeId must be a UUID." }, 400);
  }

  try {
    const result = await resetInterviewScheduleForCommittee(committeeId);
    return c.json(result);
  } catch (error) {
    const result = schedulingError(error);
    return c.json(result.body, result.status);
  }
});

interviewSlotsRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = interviewSlotCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const startsAt = parseDate(parsed.data.startsAt);
  if (!startsAt) {
    return c.json(
      { error: "startsAt must be an ISO timestamp with a timezone." },
      400,
    );
  }
  if (
    startsAt.getUTCMinutes() % 30 !== 0 ||
    startsAt.getUTCSeconds() !== 0 ||
    startsAt.getUTCMilliseconds() !== 0
  ) {
    return c.json(
      { error: "startsAt must be aligned to a 30-minute boundary." },
      400,
    );
  }
  if (startsAt.getTime() <= Date.now()) {
    return c.json({ error: "startsAt must be in the future." }, 400);
  }

  try {
    const slot = await createInterviewSlot(parsed.data.committeeId, startsAt);
    const jwt = c.get("jwtPayload") as { sub?: unknown };
    logHrAudit({
      actorEmail: typeof jwt.sub === "string" ? jwt.sub : undefined,
      action: "interview_slot.create",
      resourceType: "interview_slot",
      resourceId: slot.id,
    });
    return c.json(slot, 201);
  } catch (error) {
    const result = schedulingError(error);
    return c.json(result.body, result.status);
  }
});

interviewSlotsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid slot id." }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = interviewSlotPatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  try {
    const slot = await setInterviewSlotOpen(id, parsed.data.isOpen);
    return c.json(slot);
  } catch (error) {
    const result = schedulingError(error);
    return c.json(result.body, result.status);
  }
});
