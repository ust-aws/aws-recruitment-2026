/** Stable locale/time zone for SSR and client interview UI copy. */
export const DISPLAY_LOCALE = "en-PH"
export const DISPLAY_TIME_ZONE = "Asia/Manila"

export function formatDisplayDateTime(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleString(DISPLAY_LOCALE, {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  })
}

export function formatDisplayDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleDateString(DISPLAY_LOCALE, {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  })
}

export function formatDisplayTime(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleTimeString(DISPLAY_LOCALE, {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  })
}

export function formatInterviewSlotLabel(slot: {
  startsAt: string
  endsAt: string
}): string {
  const start = new Date(slot.startsAt)
  const end = new Date(slot.endsAt)
  return `${formatDisplayDateTime(start, {
    dateStyle: "medium",
    timeStyle: "short",
  })} – ${formatDisplayTime(end, { timeStyle: "short" })}`
}

export function formatSeasonBoundsRange(start: Date, end: Date): string {
  return `${formatDisplayDate(start, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} – ${formatDisplayDate(end, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`
}
