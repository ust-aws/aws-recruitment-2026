const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export type DatetimeParts = {
  year: number
  month: number
  day: number
  hour12: number
  minute: number
  meridiem: "am" | "pm"
}

export function parseDatetimeLocal(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDatetimeLocal(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDatetimeDisplay(value: string) {
  const date = parseDatetimeLocal(value)
  if (!date) return "Select date and time"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function partsFromDatetimeLocal(value: string, fallback = new Date()): DatetimeParts {
  const date = parseDatetimeLocal(value) ?? fallback
  const hours24 = date.getHours()
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour12: hours24 % 12 || 12,
    minute: date.getMinutes(),
    meridiem: hours24 >= 12 ? "pm" : "am",
  }
}

export function partsToDatetimeLocal(parts: DatetimeParts) {
  let hour24 = parts.hour12 % 12
  if (parts.meridiem === "pm") hour24 += 12
  return formatDatetimeLocal(
    new Date(parts.year, parts.month, parts.day, hour24, parts.minute, 0, 0)
  )
}

export function calendarDays(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function monthLabel(year: number, month: number) {
  return `${MONTHS[month]} ${year}`
}

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const
export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index)
