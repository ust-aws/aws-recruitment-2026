import { parseDateYmd, partsToDateYmd } from "@/lib/datetime/date-local"

/** Local time on the start date when applications open. */
export const RECRUITMENT_WEEK_START_HOUR = 7
export const RECRUITMENT_WEEK_START_MINUTE = 0

/** Local time on the end date when applications close (inclusive through this minute). */
export const RECRUITMENT_WEEK_END_HOUR = 23
export const RECRUITMENT_WEEK_END_MINUTE = 59

export function recruitmentWeekYmdFromIso(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return partsToDateYmd({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  })
}

export function recruitmentWeekStartIsoFromYmd(ymd: string): string | null {
  const date = parseDateYmd(ymd)
  if (!date) return null
  date.setHours(
    RECRUITMENT_WEEK_START_HOUR,
    RECRUITMENT_WEEK_START_MINUTE,
    0,
    0,
  )
  return date.toISOString()
}

export function recruitmentWeekEndIsoFromYmd(ymd: string): string | null {
  const date = parseDateYmd(ymd)
  if (!date) return null
  date.setHours(
    RECRUITMENT_WEEK_END_HOUR,
    RECRUITMENT_WEEK_END_MINUTE,
    59,
    999,
  )
  return date.toISOString()
}
