import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { deleteCookie, setCookie } from "hono/cookie";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import { applicationsRoutes } from "./routes/applications";
import { applicantAuthRoutes } from "./routes/applicant-auth";
import { applicantApplicationRoutes } from "./routes/applicant-application";
import { applicantInterviewRoutes } from "./routes/applicant-interview";
import { interviewSlotsRoutes } from "./routes/interview-slots";
import { positionsRoutes } from "./routes/positions";
import { uploadsRoutes } from "./routes/uploads";
import { recruitmentWindowRoutes } from "./routes/recruitment-window";
import { resultsRoutes } from "./routes/results";
import { interviewWindowRoutes } from "./routes/interview-window";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  expiresInSeconds,
  requireAuth,
  signToken,
  verifyHrCredentials,
} from "./auth";
import { logApiError } from "./lib/core/api-errors";
import { loginTokenInJsonAllowed } from "./lib/auth/secure-cookie";
import { requireTrustedOrigin } from "./lib/auth/trusted-origin";

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

app.use("*", secureHeaders());

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", requireTrustedOrigin);

app.get("/health", (c) => c.json({ ok: true, service: "aws-ust-api" }));

app.post("/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
  };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const verified = await verifyHrCredentials(email, password);
  if (!verified.ok) {
    return c.json({ error: "invalid credentials" }, 401);
  }

  try {
    const result = await signToken(verified.email);
    setCookie(
      c,
      AUTH_COOKIE_NAME,
      result.token,
      authCookieOptions(expiresInSeconds()),
    );
    const payload: { email: string; expiresAt: string; token?: string } = {
      email: verified.email,
      expiresAt: result.expiresAt,
    };
    if (loginTokenInJsonAllowed()) {
      payload.token = result.token;
    }
    return c.json(payload);
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
app.route("/uploads", uploadsRoutes);
app.route("/interview-slots", interviewSlotsRoutes);
app.route("/recruitment-window", recruitmentWindowRoutes);
app.route("/results", resultsRoutes);
app.route("/interview-window", interviewWindowRoutes);

export type AppType = typeof app;
