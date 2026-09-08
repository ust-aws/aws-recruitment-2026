import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import {
  APPLICANT_AUTH_COOKIE_NAME,
  APPLICANT_SESSION_SECONDS,
  applicantCookieOptions,
  assertApplicantAuthConfigured,
  getApplicantSession,
  requireApplicantAuth,
  signApplicantToken,
} from "../applicant-auth";
import { issueApplicantOtp, verifyApplicantOtp } from "../lib/applicant-otp";

export const applicantAuthRoutes = new Hono();

const APPLICATION_CODE_RE = /^AP-[0-9]{4}-[0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^[0-9]{6}$/;
const REQUEST_MESSAGE =
  "If the application details match, a verification code has been sent.";
const INVALID_CODE_MESSAGE = "The verification code is invalid or expired.";

type IdentityInput = {
  applicationCode: string;
  email: string;
};

function parseIdentity(body: unknown): IdentityInput | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  if (
    typeof input.applicationCode !== "string" ||
    typeof input.email !== "string"
  ) {
    return null;
  }
  const applicationCode = input.applicationCode.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();
  if (!APPLICATION_CODE_RE.test(applicationCode) || !EMAIL_RE.test(email)) {
    return null;
  }
  return { applicationCode, email };
}

applicantAuthRoutes.post("/request-code", async (c) => {
  const identity = parseIdentity(await c.req.json().catch(() => null));
  if (!identity) {
    return c.json(
      { error: "A valid Application ID and email are required." },
      400,
    );
  }

  try {
    assertApplicantAuthConfigured();
    await issueApplicantOtp(identity.applicationCode, identity.email);
    return c.json({ message: REQUEST_MESSAGE }, 202);
  } catch (err) {
    console.error("applicant OTP request failed", err);
    return c.json({ error: "Applicant verification is unavailable." }, 503);
  }
});

applicantAuthRoutes.post("/verify-code", async (c) => {
  const body = await c.req.json().catch(() => null);
  const identity = parseIdentity(body);
  const code =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).code
      : undefined;
  if (!identity || typeof code !== "string" || !OTP_RE.test(code)) {
    return c.json({ error: "A valid six-digit code is required." }, 400);
  }

  try {
    assertApplicantAuthConfigured();
    const session = await verifyApplicantOtp(
      identity.applicationCode,
      identity.email,
      code,
    );
    if (!session) {
      return c.json({ error: INVALID_CODE_MESSAGE }, 401);
    }

    const signed = await signApplicantToken(session);
    setCookie(
      c,
      APPLICANT_AUTH_COOKIE_NAME,
      signed.token,
      applicantCookieOptions(APPLICANT_SESSION_SECONDS),
    );
    return c.json({
      applicationCode: session.applicationCode,
      expiresAt: signed.expiresAt,
    });
  } catch (err) {
    console.error("applicant OTP verification failed", err);
    return c.json({ error: "Applicant verification is unavailable." }, 503);
  }
});

applicantAuthRoutes.get("/me", requireApplicantAuth, (c) => {
  const session = getApplicantSession(c);
  return c.json({ applicationCode: session.applicationCode });
});

applicantAuthRoutes.post("/logout", (c) => {
  deleteCookie(c, APPLICANT_AUTH_COOKIE_NAME, { path: "/" });
  return c.body(null, 204);
});
