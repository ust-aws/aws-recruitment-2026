import type { Context } from "hono";

export function logApiError(c: Context, err: unknown, context?: string) {
  const label = context ? `[api] ${context}` : "[api] unhandled error";
  console.error(
    `${label} ${c.req.method} ${c.req.path}`,
    err instanceof Error ? err.stack ?? err.message : err,
  );
}

export function internalApiError(
  c: Context,
  err: unknown,
  context: string,
  message = "Something went wrong. Please try again.",
) {
  logApiError(c, err, context);
  return c.json({ error: message }, 500);
}

export function unavailableApiError(
  c: Context,
  err: unknown,
  context: string,
  message = "This feature is temporarily unavailable. Try again in a moment.",
) {
  logApiError(c, err, context);
  return c.json({ error: message }, 503);
}
