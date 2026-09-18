import type { MiddlewareHandler } from "hono";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function collectConfiguredOrigins(): string[] {
  const values = [
    process.env.CORS_ORIGIN,
    process.env.APP_BASE_URL,
    process.env.APP_BASE_URL,
  ].filter((value): value is string => Boolean(value?.trim()));

  return values;
}

export function allowedRequestHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const value of collectConfiguredOrigins()) {
    try {
      hosts.add(new URL(value).host);
    } catch {
      // ignore invalid URL env values
    }
  }
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost");
    hosts.add("127.0.0.1");
  }
  return hosts;
}

function hostFromHeader(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function requestHost(c: { req: { header: (name: string) => string | undefined } }): string | null {
  return (
    hostFromHeader(c.req.header("Origin")) ??
    hostFromHeader(c.req.header("Referer"))
  );
}

export function isTrustedRequestHost(host: string): boolean {
  const allowed = allowedRequestHosts();
  for (const entry of allowed) {
    if (entry === "localhost" || entry === "127.0.0.1") {
      if (host === entry || host.startsWith(`${entry}:`)) return true;
      continue;
    }
    if (host === entry) return true;
  }
  return false;
}

export const requireTrustedOrigin: MiddlewareHandler = async (c, next) => {
  if (!MUTATING_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  const host = requestHost(c);
  if (!host || !isTrustedRequestHost(host)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
};
