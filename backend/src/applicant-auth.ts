import { createHmac, timingSafeEqual } from "node:crypto";
import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { Context, MiddlewareHandler } from "hono";
import { usesSecureCookies } from "./lib/auth/secure-cookie";

export const APPLICANT_AUTH_COOKIE_NAME = "applicant_token";
export const APPLICANT_SESSION_SECONDS = 60 * 60;

export type ApplicantSession = {
  applicationId: string;
  applicationCode: string;
};

function applicantAuthSecret(): string {
  const secret = process.env.APPLICANT_AUTH_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("APPLICANT_AUTH_SECRET must be at least 32 characters");
  }
  return secret;
}

export function assertApplicantAuthConfigured(): void {
  applicantAuthSecret();
}

export function hashApplicantOtp(challengeId: string, code: string): string {
  return createHmac("sha256", applicantAuthSecret())
    .update(`${challengeId}:${code}`)
    .digest("hex");
}

export function applicantOtpMatches(
  challengeId: string,
  code: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashApplicantOtp(challengeId, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}

export function applicantCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: usesSecureCookies(),
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

export async function signApplicantToken(
  session: ApplicantSession,
): Promise<{ token: string; expiresAt: string }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + APPLICANT_SESSION_SECONDS;
  const token = await sign(
    {
      sub: session.applicationId,
      applicationCode: session.applicationCode,
      scope: "applicant",
      iat: now,
      exp,
    },
    applicantAuthSecret(),
    "HS256",
  );
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

function tokenFromRequest(c: Context): string | null {
  return getCookie(c, APPLICANT_AUTH_COOKIE_NAME) ?? null;
}

function sessionFromPayload(
  payload: Record<string, unknown>,
): ApplicantSession | null {
  if (
    payload.scope !== "applicant" ||
    typeof payload.sub !== "string" ||
    typeof payload.applicationCode !== "string"
  ) {
    return null;
  }
  return {
    applicationId: payload.sub,
    applicationCode: payload.applicationCode,
  };
}

export const requireApplicantAuth: MiddlewareHandler = async (c, next) => {
  const token = tokenFromRequest(c);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }

  try {
    const payload = await verify(token, applicantAuthSecret(), "HS256");
    const session = sessionFromPayload(payload);
    if (!session) {
      return c.json({ error: "unauthorized" }, 401);
    }
    c.set("applicantSession", session);
    await next();
  } catch {
    return c.json({ error: "unauthorized" }, 401);
  }
};

export function getApplicantSession(c: Context): ApplicantSession {
  const session = c.get("applicantSession") as ApplicantSession | undefined;
  if (!session) {
    throw new Error("Applicant session is unavailable");
  }
  return session;
}
