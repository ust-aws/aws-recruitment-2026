import { Hono } from "hono";
import { cors } from "hono/cors";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import { applicationsRoutes } from "./routes/applications";
import { positionsRoutes } from "./routes/positions";
import { credentialsMatch, requireAuth, signToken } from "./auth";

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

export const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ ok: true, service: "aws-ust-api" }));

app.post("/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
  };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!credentialsMatch(email, password)) {
    return c.json({ error: "invalid credentials" }, 401);
  }

  try {
    const result = await signToken(email.trim().toLowerCase());
    return c.json(result);
  } catch {
    return c.json({ error: "auth not configured" }, 500);
  }
});

app.get("/auth/me", requireAuth, (c) => {
  const payload = c.get("jwtPayload") as { sub?: unknown };
  const email = typeof payload.sub === "string" ? payload.sub : "";
  return c.json({ email });
});

app.post("/auth/logout", requireAuth, (c) => c.body(null, 204));

app.route("/positions", positionsRoutes);

app.route("/applications", applicationsRoutes);

app.post("/uploads/presign", (c) =>
  c.json({ error: "not implemented" }, 501)
);

export type AppType = typeof app;
