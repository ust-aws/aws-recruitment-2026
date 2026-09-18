const FINAL_UPLOAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function freePlanEndDate(): Date | null {
  const raw = process.env.FREE_PLAN_END_DATE;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function uploadsAreClosed(now = new Date()): boolean {
  const end = freePlanEndDate();
  return Boolean(end && now.getTime() >= end.getTime() - FINAL_UPLOAD_WINDOW_MS);
}

export function documentsAreExpired(now = new Date()): boolean {
  const end = freePlanEndDate();
  return Boolean(end && now >= end);
}
