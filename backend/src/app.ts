import { Hono } from "hono";
import { cors } from "hono/cors";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import { positionsRoutes } from "./routes/positions";

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

app.route("/positions", positionsRoutes);

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
