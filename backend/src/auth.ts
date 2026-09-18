import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { Context, MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { usesSecureCookies } from "./lib/auth/secure-cookie";

export const AUTH_COOKIE_NAME = "hr_token";

const DEFAULT_EXPIRES_SECONDS = 8 * 60 * 60;

export function expiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? "8h";
  const hours = raw.endsWith("h") ? Number(raw.slice(0, -1)) : Number.NaN;
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_EXPIRES_SECONDS;
  return Math.floor(hours * 60 * 60);
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: usesSecureCookies(),
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

export async function verifyHrCredentials(
  email: string,
  password: string,
): Promise<{ ok: true; email: string } | { ok: false }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false };
  }

  const [user] = await db
    .select({
      email: users.email,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !user.isActive) {
    return { ok: false };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return { ok: false };
  }

  return { ok: true, email: user.email };
}

export async function signToken(
  subject: string,
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

export async function authenticateHrRequest(c: Context): Promise<boolean> {
  const token = tokenFromRequest(c);
  if (!token) return false;
  try {
    c.set("jwtPayload", await verifyToken(token));
    return true;
  } catch {
    return false;
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!(await authenticateHrRequest(c))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
};
