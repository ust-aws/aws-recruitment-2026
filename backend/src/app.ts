import { Hono } from "hono";
import { cors } from "hono/cors";
import { asc, eq } from "drizzle-orm";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import { db } from "./db";
import { committees, positions } from "./db/schema";

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

export const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  })
);

app.get("/health", (c) => c.json({ ok: true, service: "aws-ust-api" }));

function parseResponsibilities(value: string | null) {
  return value
    ? value
        .split(/\r?\n/)
        .map((responsibility) => responsibility.trim())
        .filter(Boolean)
    : [];
}

app.get("/positions", async (c) => {
  const rows = await db
    .select({
      id: positions.id,
      title: positions.name,
      office: positions.office,
      committee: committees.name,
      committeeDescription: committees.description,
      description: positions.description,
      responsibilities: positions.responsibilities,
      isOpen: positions.isOpen,
    })
    .from(positions)
    .innerJoin(committees, eq(positions.committeeId, committees.id))
    .where(eq(positions.isOpen, true))
    .orderBy(asc(positions.office), asc(positions.name));

  return c.json(
    rows.map((row) => ({
      ...row,
      office: row.office ?? row.committee,
      committeeDescription: row.committeeDescription ?? "",
      description: row.description ?? "",
      responsibilities: parseResponsibilities(row.responsibilities),
    })),
  );
});

app.get("/applications", (c) => c.json({ applications: [], total: 0 }));

app.post("/applications", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json(
    { id: crypto.randomUUID(), status: "submitted", ...body },
    201
  );
});

app.get("/applications/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, status: "submitted" });
});

app.patch("/applications/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  return c.json({ id, status: body.status ?? "unknown" });
});

app.post("/uploads/presign", (c) =>
  c.json({ error: "not implemented" }, 501)
);

export type AppType = typeof app;
