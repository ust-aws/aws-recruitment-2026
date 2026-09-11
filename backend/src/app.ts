import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, setCookie } from "hono/cookie";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import { applicationsRoutes } from "./routes/applications";
import { applicantAuthRoutes } from "./routes/applicant-auth";
import { applicantApplicationRoutes } from "./routes/applicant-application";
import { applicantInterviewRoutes } from "./routes/applicant-interview";
import { interviewSlotsRoutes } from "./routes/interview-slots";
import { positionsRoutes } from "./routes/positions";
import { recruitmentWindowRoutes } from "./routes/recruitment-window";
import { resultsRoutes } from "./routes/results";
import { interviewWindowRoutes } from "./routes/interview-window";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  credentialsMatch,
  expiresInSeconds,
  requireAuth,
  signToken,
} from "./auth";
import { logApiError } from "./lib/api-errors";

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

export const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
  logApiError(c, err);
  return c.json(
    { error: "Something went wrong. Please try again." },
    500,
  );
});

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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
    const subject = email.trim().toLowerCase();
    const result = await signToken(subject);
    setCookie(
      c,
      AUTH_COOKIE_NAME,
      result.token,
      authCookieOptions(expiresInSeconds())
    );
    return c.json({
      email: subject,
      expiresAt: result.expiresAt,
      // Bearer token kept for non-browser API clients (e.g. smoke tests).
      token: result.token,
    });
  } catch {
    return c.json({ error: "auth not configured" }, 500);
  }
});

app.get("/auth/me", requireAuth, (c) => {
  const payload = c.get("jwtPayload") as { sub?: unknown };
  const email = typeof payload.sub === "string" ? payload.sub : "";
  return c.json({ email });
});

app.post("/auth/logout", (c) => {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    ...authCookieOptions(0),
    maxAge: 0,
  });
  return c.body(null, 204);
});

app.route("/positions", positionsRoutes);

app.route("/applicant-auth", applicantAuthRoutes);
app.route("/applicant", applicantApplicationRoutes);
app.route("/applicant", applicantInterviewRoutes);

app.route("/applications", applicationsRoutes);
app.route("/interview-slots", interviewSlotsRoutes);
app.route("/recruitment-window", recruitmentWindowRoutes);
app.route("/results", resultsRoutes);
app.route("/interview-window", interviewWindowRoutes);

app.post("/uploads/presign", (c) =>
  c.json({ error: "not implemented" }, 501)
);

export type AppType = typeof app;
