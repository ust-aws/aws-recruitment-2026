import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { committees, positions } from "../db/schema";

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
  committee: string;
  description: string | null;
  responsibilities: string | null;
};

type PositionRow = {
  id: string;
  title: string;
  committeeId: string;
  committee: string;
  description: string | null;
  responsibilities: string | null;
};

function toPositionResponse(row: PositionRow): PositionResponse {
  return {
    id: row.id,
    title: row.title,
    committee_id: row.committeeId,
    committee: row.committee,
    description: row.description,
    responsibilities: row.responsibilities,
  };
}

async function selectAllPositions() {
  return db
    .select({
      id: positions.id,
      title: positions.name,
      committeeId: positions.committeeId,
      committee: committees.name,
      description: positions.description,
      responsibilities: positions.responsibilities,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id));
}

async function selectPositionById(id: string) {
  const rows = await db
    .select({
      id: positions.id,
      title: positions.name,
      committeeId: positions.committeeId,
      committee: committees.name,
      description: positions.description,
      responsibilities: positions.responsibilities,
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

function parsePositionPayload(
  body: unknown,
  partial: boolean
): { ok: true; data: Partial<PositionPayload> } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid JSON body" };
  }

  const record = body as Record<string, unknown>;
  const data: Partial<PositionPayload> = {};

  if ("title" in record) {
    if (typeof record.title !== "string" || !record.title.trim()) {
      return {
        ok: false,
        error: "title is required and must be a non-empty string",
      };
    }
    data.title = record.title.trim();
  } else if (!partial) {
    return { ok: false, error: "title is required" };
  }

  if ("committee_id" in record) {
    if (typeof record.committee_id !== "string" || !record.committee_id.trim()) {
      return {
        ok: false,
        error: "committee_id is required and must be a string",
      };
    }
    data.committee_id = record.committee_id.trim();
  } else if (!partial) {
    return { ok: false, error: "committee_id is required" };
  }

  if ("description" in record) {
    data.description =
      typeof record.description === "string" ? record.description : "";
  } else if (!partial) {
    data.description = "";
  }

  if ("responsibilities" in record) {
    data.responsibilities =
      typeof record.responsibilities === "string"
        ? record.responsibilities
        : "";
  } else if (!partial) {
    data.responsibilities = "";
  }

  return { ok: true, data };
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
  const rows = await selectAllPositions();
  return c.json(rows.map(toPositionResponse));
});

positionsRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = parsePositionPayload(body, false);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }

  const payload = parsed.data as PositionPayload;

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
  return c.json(toPositionResponse(row), 201);
});

positionsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await selectPositionById(id);
  if (!existing) {
    return c.json({ error: "Position not found" }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = parsePositionPayload(body, true);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
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
  return c.json(toPositionResponse(row));
});

positionsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await db
    .delete(positions)
    .where(eq(positions.id, id))
    .returning({ id: positions.id });

  if (deleted.length === 0) {
    return c.json({ error: "Position not found" }, 404);
  }

  return c.body(null, 204);
});
