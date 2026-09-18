import {
  EVENTS_CALENDAR_MONTH_LABEL,
  EVENTS_CALENDAR_OUTLINED_DAY,
  EVENTS_CALENDAR_SCHEDULED_DAYS,
} from "@/lib/site/events-schedule"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const

/** August 2026 — 1st is Saturday (offset 6). */
const AUGUST_2026_LEADING_BLANKS = 6
const AUGUST_2026_DAYS = 31

const panelClasses =
  "flex w-full flex-col gap-5 rounded-[28px] border border-biloba-flower/20 bg-meteorite/70 px-6 py-7 md:px-7"
const monthTitleClasses = "font-sans text-lg font-bold text-blue-chalk"
const weekdayRowClasses = "grid grid-cols-7 text-center"
const weekdayClasses = "font-sans text-[0.7rem] font-medium text-prelude/70"
const dayGridClasses = "grid grid-cols-7"
const dayBaseClasses =
  "flex h-9 items-center justify-center font-sans text-sm text-prelude"
const dayEventClasses =
  "rounded-[10px] border border-aquamarine font-medium text-blue-chalk"
const legendRowClasses = "flex items-center gap-2 font-sans text-xs text-prelude"
const legendDotClasses = "size-2 shrink-0 rounded-full bg-aquamarine"

function isEventDay(day: number): boolean {
  return (
    EVENTS_CALENDAR_SCHEDULED_DAYS.has(day) ||
    day === EVENTS_CALENDAR_OUTLINED_DAY
  )
}

function dayCellClasses(day: number): string {
  if (isEventDay(day)) {
    return cn(dayBaseClasses, dayEventClasses)
  }
  return dayBaseClasses
}

export function EventsCalendarMock() {
  const cells: (number | null)[] = [
    ...Array.from({ length: AUGUST_2026_LEADING_BLANKS }, () => null),
    ...Array.from({ length: AUGUST_2026_DAYS }, (_, index) => index + 1),
  ]

  return (
    <aside className={panelClasses} aria-label="Events calendar preview">
      <p className={monthTitleClasses}>{EVENTS_CALENDAR_MONTH_LABEL}</p>

      <div className={weekdayRowClasses}>
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`} className={weekdayClasses}>
            {label}
          </span>
        ))}
      </div>

      <div className={dayGridClasses}>
        {cells.map((day, index) =>
          day === null ? (
            <span key={`blank-${index}`} className={dayBaseClasses} aria-hidden />
          ) : (
            <span key={day} className={dayCellClasses(day)}>
              {day}
              {isEventDay(day) ? (
                <span className="sr-only"> — AWS Builders event scheduled</span>
              ) : null}
            </span>
          )
        )}
      </div>

      <div className={legendRowClasses}>
        <span className={legendDotClasses} aria-hidden />
        <span>AWS Builders event scheduled</span>
      </div>
    </aside>
  )
}
