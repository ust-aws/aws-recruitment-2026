import { createHash, timingSafeEqual } from "node:crypto";
import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { Context, MiddlewareHandler } from "hono";

export const AUTH_COOKIE_NAME = "hr_token";

const DEFAULT_EXPIRES_SECONDS = 8 * 60 * 60;

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function expiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? "8h";
  const hours = raw.endsWith("h") ? Number(raw.slice(0, -1)) : Number.NaN;
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_EXPIRES_SECONDS;
  return Math.floor(hours * 60 * 60);
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

function tokenFromRequest(c: Context): string | null {
  const cookieToken = getCookie(c, AUTH_COOKIE_NAME);
  if (cookieToken) return cookieToken;

  const header = c.req.header("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;

  const bearerToken = header.slice("Bearer ".length).trim();
  return bearerToken || null;
}

export function credentialsMatch(email: string, password: string): boolean {
  const expectedEmail = process.env.HR_EMAIL ?? "";
  const expectedPassword = process.env.HR_PASSWORD ?? "";
  if (!expectedEmail || !expectedPassword || !email || !password) {
    return false;
  }

  const emailOk = safeEqual(
    email.trim().toLowerCase(),
    expectedEmail.trim().toLowerCase()
  );
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

export async function signToken(
  subject: string
): Promise<{ token: string; expiresAt: string }> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds();
  const token = await sign({ sub: subject, exp }, secret, "HS256");
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

export async function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return verify(token, secret, "HS256");
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = tokenFromRequest(c);
  if (!token) {
    return c.json({ error: "unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ error: "unauthorized" }, 401);
  }
};
