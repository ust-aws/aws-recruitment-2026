"use client"

import { useMemo, useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  WEEKDAY_LABELS,
  calendarDays,
  formatDatetimeDisplay,
  formatDatetimeLocal,
  monthLabel,
  partsFromDatetimeLocal,
  partsToDatetimeLocal,
  type DatetimeParts,
} from "@/lib/datetime/datetime-local"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const panelClasses = "flex flex-col gap-4 p-1 sm:flex-row sm:gap-0"
const calendarSectionClasses = "min-w-[17rem] sm:pr-4 sm:border-r sm:border-biloba-flower/20"
const headerClasses = "mb-3 flex items-center justify-between gap-2"
const monthClasses = "font-sans text-sm font-semibold text-blue-chalk"
const navButtonClasses =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-prelude transition-colors hover:bg-biloba-flower/15 hover:text-aquamarine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const weekdayRowClasses =
  "mb-1 grid grid-cols-7 gap-1 font-mono text-[0.65rem] uppercase tracking-wide text-prelude"
const dayGridClasses = "grid grid-cols-7 gap-1"
const dayButtonClasses =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] font-sans text-sm text-blue-chalk transition-colors hover:bg-biloba-flower/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const daySelectedClasses = "bg-aquamarine font-semibold text-haiti hover:bg-aquamarine"
const footerClasses = "mt-3 flex items-center justify-between gap-3"
const footerActionClasses =
  "cursor-pointer font-mono text-xs text-aquamarine transition-colors hover:text-blue-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const timeSectionClasses = "flex min-w-[9.5rem] gap-2 pt-1 sm:pl-4"
const timeColumnClasses = "panel-scroll max-h-56 w-12 overflow-y-auto"
const timeOptionClasses =
  "flex h-9 w-full cursor-pointer items-center justify-center rounded-[10px] font-mono text-sm text-prelude transition-colors hover:bg-biloba-flower/15 hover:text-blue-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"
const timeOptionSelectedClasses = "bg-aquamarine font-semibold text-haiti hover:bg-aquamarine"
const triggerClasses = cn(
  fieldControlClasses,
  "flex items-center justify-between gap-3 text-left"
)
const triggerValueClasses = "min-w-0 flex-1 truncate"
const triggerPlaceholderClasses = "text-prelude/70"
const iconClasses = "size-4 shrink-0 text-aquamarine"

type DatetimePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

function TimeColumn<T extends number | string>({
  options,
  value,
  onChange,
  formatOption,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  formatOption: (value: T) => string
}) {
  return (
    <div className={timeColumnClasses}>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          className={cn(
            timeOptionClasses,
            value === option && timeOptionSelectedClasses
          )}
          onClick={() => onChange(option)}
        >
          {formatOption(option)}
        </button>
      ))}
    </div>
  )
}

export function DatetimePicker({
  id,
  value,
  onChange,
  required,
  className,
}: DatetimePickerProps) {
  const [open, setOpen] = useState(false)
  const [parts, setParts] = useState<DatetimeParts>(() =>
    partsFromDatetimeLocal(value)
  )

  function handleOpenChange(next: boolean) {
    if (next) {
      setParts(partsFromDatetimeLocal(value))
    }
    setOpen(next)
  }

  const days = useMemo(
    () => calendarDays(parts.year, parts.month),
    [parts.month, parts.year]
  )

  function updateParts(next: DatetimeParts) {
    setParts(next)
    onChange(partsToDatetimeLocal(next))
  }

  function shiftMonth(delta: number) {
    const next = new Date(parts.year, parts.month + delta, 1)
    setParts((current) => ({
      ...current,
      year: next.getFullYear(),
      month: next.getMonth(),
    }))
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        type="button"
        className={cn(triggerClasses, className)}
        aria-required={required}
      >
        <span
          className={cn(
            triggerValueClasses,
            !value && triggerPlaceholderClasses
          )}
        >
          {formatDatetimeDisplay(value)}
        </span>
        <CalendarIcon className={iconClasses} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="p-4" align="start">
        <div className={panelClasses}>
          <section className={calendarSectionClasses}>
            <div className={headerClasses}>
              <button
                type="button"
                className={navButtonClasses}
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className={monthClasses}>{monthLabel(parts.year, parts.month)}</p>
              <button
                type="button"
                className={navButtonClasses}
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className={weekdayRowClasses}>
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-center">
                  {label}
                </span>
              ))}
            </div>
            <div className={dayGridClasses}>
              {days.map((day, index) =>
                day ? (
                  <button
                    key={`${parts.year}-${parts.month}-${day}`}
                    type="button"
                    className={cn(
                      dayButtonClasses,
                      parts.day === day && daySelectedClasses
                    )}
                    onClick={() => updateParts({ ...parts, day })}
                  >
                    {day}
                  </button>
                ) : (
                  <span key={`empty-${index}`} className="h-9 w-9" />
                )
              )}
            </div>
            <div className={footerClasses}>
              <button
                type="button"
                className={footerActionClasses}
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className={footerActionClasses}
                onClick={() => {
                  const today = partsFromDatetimeLocal(
                    formatDatetimeLocal(new Date())
                  )
                  updateParts(today)
                }}
              >
                Today
              </button>
            </div>
          </section>
          <section className={timeSectionClasses} aria-label="Time">
            <TimeColumn
              options={HOUR_OPTIONS}
              value={parts.hour12}
              onChange={(hour12) => updateParts({ ...parts, hour12 })}
              formatOption={(hour) => String(hour).padStart(2, "0")}
            />
            <TimeColumn
              options={MINUTE_OPTIONS}
              value={parts.minute}
              onChange={(minute) => updateParts({ ...parts, minute })}
              formatOption={(minute) => String(minute).padStart(2, "0")}
            />
            <TimeColumn
              options={["am", "pm"]}
              value={parts.meridiem}
              onChange={(meridiem) => updateParts({ ...parts, meridiem })}
              formatOption={(meridiem) => meridiem}
            />
          </section>
        </div>
      </PopoverContent>
    </Popover>
  )
}
