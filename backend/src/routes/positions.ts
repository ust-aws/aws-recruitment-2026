import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { committees, positions } from "../db/schema";

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

async function selectOpenPositions() {
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
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.isOpen, true));
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
    const committeeId = record.committee_id.trim();
    if (!isUuid(committeeId)) {
      return { ok: false, error: "committee_id must be a UUID." };
    }
    data.committee_id = committeeId;
  } else if (!partial) {
    return { ok: false, error: "committee_id is required" };
  }

  if ("description" in record) {
    if (typeof record.description !== "string") {
      return { ok: false, error: "description must be a string" };
    }
    data.description = record.description;
  } else if (!partial) {
    data.description = "";
  }

  if ("responsibilities" in record) {
    if (typeof record.responsibilities !== "string") {
      return { ok: false, error: "responsibilities must be a string" };
    }
    data.responsibilities = record.responsibilities;
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
  const rows = await selectOpenPositions();
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
  if (!isUuid(id)) {
    return c.json({ error: "Invalid position id." }, 400);
  }

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
