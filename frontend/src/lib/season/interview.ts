import { parseDateYmd, partsToDateYmd } from "@/lib/datetime/date-local"

/** Local hours; grid shows 30-minute slots from 7:00 AM through 9:30 PM. */
export const INTERVIEW_GRID_START_HOUR = 7
export const INTERVIEW_GRID_END_HOUR = 22
export const INTERVIEW_SLOT_MINUTES = 30
export const INTERVIEW_SEASON_END_HOUR = 21
export const INTERVIEW_SEASON_END_MINUTE = 30

export type InterviewSeasonBounds = {
  startsAt: Date
  endsAt: Date
} | null

export function interviewSeasonBoundsFromPayload(payload: {
  startsAt: string | null
  endsAt: string | null
}): InterviewSeasonBounds {
  if (!payload.startsAt || !payload.endsAt) return null
  const startsAt = new Date(payload.startsAt)
  const endsAt = new Date(payload.endsAt)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return null
  }
  return { startsAt, endsAt }
}

export function interviewSeasonYmdFromIso(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return partsToDateYmd({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  })
}

export function interviewSeasonStartIsoFromYmd(ymd: string): string | null {
  const date = parseDateYmd(ymd)
  if (!date) return null
  date.setHours(INTERVIEW_GRID_START_HOUR, 0, 0, 0)
  return date.toISOString()
}

export function interviewSeasonEndIsoFromYmd(ymd: string): string | null {
  const date = parseDateYmd(ymd)
  if (!date) return null
  date.setHours(INTERVIEW_SEASON_END_HOUR, INTERVIEW_SEASON_END_MINUTE, 0, 0)
  return date.toISOString()
}

function createInterviewTimeLabels(): string[] {
  const labels: string[] = []
  for (let hour = INTERVIEW_GRID_START_HOUR; hour < INTERVIEW_GRID_END_HOUR; hour++) {
    for (const minute of [0, 30]) {
      const date = new Date(2000, 0, 1, hour, minute)
      labels.push(
        date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })
      )
    }
  }
  return labels
}

export const INTERVIEW_TIME_LABELS = createInterviewTimeLabels()

/** Sunday 00:00 local — interview weeks run Sunday through Saturday. */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Monday–Saturday columns for a Sun–Sat week; Sundays are never schedulable. */
export function weekDaysInSeason(
  weekStart: Date,
  bounds: InterviewSeasonBounds
): Date[] {
  if (!bounds) return []
  const seasonStart = startOfDay(bounds.startsAt)
  const seasonEnd = startOfDay(bounds.endsAt)
  const days: Date[] = []
  for (let index = 1; index <= 6; index += 1) {
    const day = startOfDay(addDays(weekStart, index))
    if (day < seasonStart || day > seasonEnd) continue
    days.push(day)
  }
  return days
}

export function slotStartsAt(day: Date, rowIndex: number): Date {
  const hour = INTERVIEW_GRID_START_HOUR + Math.floor(rowIndex / 2)
  const minute = rowIndex % 2 === 0 ? 0 : 30
  const startsAt = new Date(day)
  startsAt.setHours(hour, minute, 0, 0)
  return startsAt
}

export function slotKey(startsAt: Date): string {
  return String(startsAt.getTime())
}

export function slotKeyFromIso(iso: string): string {
  return String(new Date(iso).getTime())
}

export function formatWeekRange(_weekStart: Date, days: Date[]): string {
  if (days.length === 0) return "No days in season"
  const first = days[0]
  const last = days[days.length - 1]
  const startLabel = first.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const endLabel = last.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${startLabel} – ${endLabel}`
}

export function weekQueryRange(weekStart: Date, days: Date[]) {
  if (days.length === 0) {
    return { from: weekStart.toISOString(), to: addDays(weekStart, 7).toISOString() }
  }
  const from = new Date(days[0])
  from.setHours(0, 0, 0, 0)
  const to = new Date(days[days.length - 1])
  to.setDate(to.getDate() + 1)
  to.setHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

function seasonWeekStarts(bounds: InterviewSeasonBounds): Date[] {
  if (!bounds) return []
  const weeks: Date[] = []
  let cursor = startOfWeek(bounds.startsAt)
  const last = startOfWeek(bounds.endsAt)
  while (cursor.getTime() <= last.getTime()) {
    if (weekDaysInSeason(cursor, bounds).length > 0) {
      weeks.push(new Date(cursor))
    }
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export function clampWeekStart(
  weekStart: Date,
  bounds: InterviewSeasonBounds
): Date {
  const weeks = seasonWeekStarts(bounds)
  if (weeks.length === 0) return weekStart
  const normalized = startOfWeek(weekStart)
  if (normalized.getTime() < weeks[0].getTime()) return weeks[0]
  if (normalized.getTime() > weeks[weeks.length - 1].getTime()) {
    return weeks[weeks.length - 1]
  }
  if (weekDaysInSeason(normalized, bounds).length > 0) {
    return normalized
  }
  for (const week of weeks) {
    if (week.getTime() >= normalized.getTime()) return week
  }
  return weeks[weeks.length - 1]
}

export function canGoPrevWeek(
  weekStart: Date,
  bounds: InterviewSeasonBounds
): boolean {
  if (!bounds) return false
  return weekDaysInSeason(addDays(weekStart, -7), bounds).length > 0
}

export function canGoNextWeek(
  weekStart: Date,
  bounds: InterviewSeasonBounds
): boolean {
  if (!bounds) return false
  return weekDaysInSeason(addDays(weekStart, 7), bounds).length > 0
}
