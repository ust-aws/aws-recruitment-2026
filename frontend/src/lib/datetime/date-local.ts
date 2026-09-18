const BIRTHDAY_YEAR_MIN = 1950

export type DateParts = {
  year: number
  month: number
  day: number
}

export function parseDateYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function partsToDateYmd(parts: DateParts) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`
}

export function partsFromDateYmd(value: string, fallback = new Date()): DateParts {
  const date = parseDateYmd(value) ?? fallback
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }
}

export function formatDateDisplay(value: string, placeholder = "Select date") {
  const date = parseDateYmd(value)
  if (!date) return placeholder
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function isValidBirthdayYmd(value: string) {
  const date = parseDateYmd(value)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date <= today
}

export function birthdayYearOptions() {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let year = current; year >= BIRTHDAY_YEAR_MIN; year -= 1) {
    years.push(year)
  }
  return years
}
