import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { committees, positions } from "../db/schema";
import { authenticateHrRequest, requireAuth } from "../auth";
import {
  InterviewScheduleError,
  listOpenInterviewSlotsForPosition,
} from "../lib/interview/scheduling";
import {
  positionCreateSchema,
  positionPatchSchema,
  zodErrorMessage,
} from "../lib/hr/schemas";
import { logHrAudit } from "../lib/hr/audit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type PositionPayload = {
  title: string;
  committee_id: string;
  description: string;
  responsibilities: string;
};

type PositionResponse = {
  id: string;
  title: string;
  committee_id: string;
  office: string;
  committee: string;
  committeeDescription: string;
  description: string;
  responsibilities: string;
  isOpen: boolean;
  openSlots: number;
};

type PositionRow = {
  id: string;
  title: string;
  committeeId: string;
  office: string | null;
  committee: string;
  committeeDescription: string | null;
  description: string | null;
  responsibilities: string | null;
  isOpen: boolean;
  openSlots: number;
};

function toPositionResponse(row: PositionRow): PositionResponse {
  return {
    id: row.id,
    title: row.title,
    committee_id: row.committeeId,
    office: row.office ?? row.committee,
    committee: row.committee,
    committeeDescription: row.committeeDescription ?? "",
    description: row.description ?? "",
    responsibilities: row.responsibilities ?? "",
    isOpen: row.isOpen,
    openSlots: row.openSlots,
  };
}

async function selectAllPositions() {
  return db
    .select({
      id: positions.id,
      title: positions.name,
      committeeId: positions.committeeId,
      office: positions.office,
      committee: committees.name,
      committeeDescription: committees.description,
      description: positions.description,
      responsibilities: positions.responsibilities,
      isOpen: positions.isOpen,
      openSlots: positions.openSlots,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .orderBy(asc(positions.office), asc(positions.name));
}

async function selectOpenPositions() {
  return db
    .select({
      id: positions.id,
      title: positions.name,
      committeeId: positions.committeeId,
      office: positions.office,
      committee: committees.name,
      committeeDescription: committees.description,
      description: positions.description,
      responsibilities: positions.responsibilities,
      isOpen: positions.isOpen,
      openSlots: positions.openSlots,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.isOpen, true))
    .orderBy(asc(positions.office), asc(positions.name));
}

async function selectPositionById(id: string) {
  const rows = await db
    .select({
      id: positions.id,
      title: positions.name,
      committeeId: positions.committeeId,
      office: positions.office,
      committee: committees.name,
      committeeDescription: committees.description,
      description: positions.description,
      responsibilities: positions.responsibilities,
      isOpen: positions.isOpen,
      openSlots: positions.openSlots,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.id, id));

  return rows[0];
}

async function committeeExists(id: string) {
  const rows = await db
    .select({ id: committees.id })
    .from(committees)
    .where(eq(committees.id, id));

  return rows.length > 0;
}

async function hasDuplicateTitle(committeeId: string, title: string, excludeId?: string) {
  const rows = await db
    .select({ id: positions.id })
    .from(positions)
    .where(
      and(eq(positions.committeeId, committeeId), eq(positions.name, title))
    );

  if (excludeId) {
    return rows.some((row) => row.id !== excludeId);
  }

  return rows.length > 0;
}

export const positionsRoutes = new Hono();

positionsRoutes.get("/", async (c) => {
  const scope = c.req.query("scope");
  if (scope === "all") {
    if (!(await authenticateHrRequest(c))) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const rows = await selectAllPositions();
    return c.json(rows.map(toPositionResponse));
  }
  const rows = await selectOpenPositions();
  return c.json(rows.map(toPositionResponse));
});

positionsRoutes.get("/:id/interview-slots", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid position id." }, 400);
  }

  try {
    const schedule = await listOpenInterviewSlotsForPosition(id);
    return c.json(schedule);
  } catch (error) {
    if (error instanceof InterviewScheduleError) {
      const status = error.code === "position_not_found" ? 404 : 409;
      return c.json({ error: error.message }, status);
    }
    throw error;
  }
});

positionsRoutes.post("/", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = positionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const payload: PositionPayload = {
    title: parsed.data.title,
    committee_id: parsed.data.committee_id,
    description: parsed.data.description,
    responsibilities: parsed.data.responsibilities,
  };

  if (!(await committeeExists(payload.committee_id))) {
    return c.json({ error: "Committee not found" }, 404);
  }

  if (await hasDuplicateTitle(payload.committee_id, payload.title)) {
    return c.json(
      { error: "Position with this title already exists in the committee" },
      409
    );
  }

  const [inserted] = await db
    .insert(positions)
    .values({
      name: payload.title,
      committeeId: payload.committee_id,
      description: payload.description,
      responsibilities: payload.responsibilities,
    })
    .returning({ id: positions.id });

  const row = await selectPositionById(inserted.id);
  const jwt = c.get("jwtPayload") as { sub?: unknown };
  logHrAudit({
    actorEmail: typeof jwt.sub === "string" ? jwt.sub : undefined,
    action: "position.create",
    resourceType: "position",
    resourceId: inserted.id,
  });
  return c.json(toPositionResponse(row), 201);
});

positionsRoutes.patch("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) {
    return c.json({ error: "Invalid position id." }, 400);
  }

  const existing = await selectPositionById(id);
  if (!existing) {
    return c.json({ error: "Position not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = positionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: zodErrorMessage(parsed.error) }, 400);
  }

  const title = parsed.data.title ?? existing.title;
  const committeeId = parsed.data.committee_id ?? existing.committeeId;
  const description =
    parsed.data.description ?? existing.description ?? "";
  const responsibilities =
    parsed.data.responsibilities ?? existing.responsibilities ?? "";

  if (
    committeeId !== existing.committeeId &&
    !(await committeeExists(committeeId))
  ) {
    return c.json({ error: "Committee not found" }, 404);
  }

  if (await hasDuplicateTitle(committeeId, title, id)) {
    return c.json(
      { error: "Position with this title already exists in the committee" },
      409
    );
  }

  await db
    .update(positions)
    .set({
      name: title,
      committeeId,
      description,
      responsibilities,
    })
    .where(eq(positions.id, id));

  const row = await selectPositionById(id);
  const jwt = c.get("jwtPayload") as { sub?: unknown };
  logHrAudit({
    actorEmail: typeof jwt.sub === "string" ? jwt.sub : undefined,
    action: "position.update",
    resourceType: "position",
    resourceId: id,
  });
  return c.json(toPositionResponse(row));
});
