"use client"

import { useMemo, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  birthdayYearOptions,
  formatDateDisplay,
  parseDateYmd,
  partsToDateYmd,
} from "@/lib/date-local"
import { fieldControlClasses } from "@/lib/surface"
import { cn } from "@/lib/utils"

const triggerClasses = cn(
  fieldControlClasses,
  "flex items-center justify-between gap-3 text-left"
)
const triggerValueClasses = "min-w-0 flex-1 truncate"
const triggerPlaceholderClasses = "text-prelude/70"
const iconClasses = "size-4 shrink-0 text-aquamarine"
const popoverContentClasses = "w-auto border-blue-chalk/25 bg-haiti p-0"
const calendarClasses =
  "bg-transparent p-3 [--cell-size:2.25rem] text-blue-chalk [&_option]:bg-haiti [&_option]:text-blue-chalk [&_select]:scheme-dark [&_.rdp-weekday]:font-mono [&_.rdp-weekday]:text-[0.65rem] [&_.rdp-weekday]:uppercase [&_.rdp-weekday]:text-prelude"
const footerClasses = "border-t border-blue-chalk/15 px-3 py-2"
const clearButtonClasses =
  "cursor-pointer font-mono text-xs text-aquamarine transition-colors hover:text-blue-chalk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40"

type DatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  required,
  className,
  placeholder = "Select birthday",
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseDateYmd(value) ?? undefined, [value])
  const yearOptions = useMemo(() => birthdayYearOptions(), [])
  const fromYear = yearOptions[yearOptions.length - 1] ?? 1950
  const toYear = yearOptions[0] ?? new Date().getFullYear()
  const startMonth = useMemo(() => new Date(fromYear, 0, 1), [fromYear])
  const endMonth = useMemo(() => new Date(toYear, 11, 1), [toYear])
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {formatDateDisplay(value, placeholder)}
        </span>
        <CalendarIcon className={iconClasses} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className={popoverContentClasses} align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          selected={selected}
          defaultMonth={selected ?? new Date(toYear, 0, 1)}
          onSelect={(date) => {
            if (!date) return
            onChange(
              partsToDateYmd({
                year: date.getFullYear(),
                month: date.getMonth(),
                day: date.getDate(),
              })
            )
            setOpen(false)
          }}
          disabled={{ after: today }}
          showOutsideDays={false}
          className={calendarClasses}
          buttonVariant="ghost"
        />
        <div className={footerClasses}>
          <button
            type="button"
            className={clearButtonClasses}
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
