"use client"

import { useMemo, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  formatDateDisplay,
  parseDateYmd,
  partsToDateYmd,
} from "@/lib/datetime/date-local"
import { fieldControlClasses } from "@/lib/site/surface"
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

type InterviewSeasonDatePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

export function InterviewSeasonDatePicker({
  id,
  value,
  onChange,
  required,
  className,
  placeholder = "Select date",
}: InterviewSeasonDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseDateYmd(value) ?? undefined, [value])
  const currentYear = new Date().getFullYear()
  const fromYear = currentYear - 1
  const toYear = currentYear + 2
  const startMonth = useMemo(() => new Date(fromYear, 0, 1), [fromYear])
  const endMonth = useMemo(() => new Date(toYear, 11, 1), [toYear])

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
          defaultMonth={selected ?? startMonth}
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
          showOutsideDays={false}
          className={calendarClasses}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  )
}
