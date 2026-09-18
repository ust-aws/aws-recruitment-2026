export function usesSecureCookies(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const candidates = [
    process.env.CORS_ORIGIN,
    process.env.APP_BASE_URL,
    process.env.APP_BASE_URL,
  ];
  return candidates.some((value) => value?.trim().toLowerCase().startsWith("https://"));
}

export function loginTokenInJsonAllowed(): boolean {
  return process.env.ALLOW_LOGIN_TOKEN_RESPONSE === "true";
}
