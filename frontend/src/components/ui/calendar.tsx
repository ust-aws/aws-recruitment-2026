"use client"

import * as React from "react"
import { formatDisplayDate } from "@/lib/datetime/display"
import { cn } from "@/lib/utils"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DropdownProps,
} from "react-day-picker"

import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

const navButtonClasses =
  "inline-flex size-(--cell-size) shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent p-0 text-prelude shadow-none transition-colors select-none hover:bg-biloba-flower/15 hover:text-aquamarine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40 aria-disabled:pointer-events-none aria-disabled:opacity-50"

const dayButtonClasses =
  "inline-flex aspect-square size-auto w-full min-w-(--cell-size) cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent p-0 font-sans text-sm font-normal text-blue-chalk transition-colors hover:bg-biloba-flower/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/40 disabled:pointer-events-none disabled:opacity-50 data-[selected-single=true]:bg-aquamarine data-[selected-single=true]:font-semibold data-[selected-single=true]:text-haiti data-[selected-single=true]:hover:bg-aquamarine"

const dropdownRootClasses =
  "relative z-20 inline-flex h-8 shrink-0 items-center overflow-hidden rounded-[10px] border border-blue-chalk/20 bg-haiti/70"
const dropdownLabelClasses =
  "px-2.5 font-sans text-xs font-medium whitespace-nowrap text-blue-chalk"
const dropdownChevronWrapClasses =
  "flex h-full w-7 shrink-0 items-center justify-center border-l border-blue-chalk/20 text-prelude"
const dropdownSelectOverlayClasses =
  "absolute inset-0 z-10 cursor-pointer opacity-0"

function CalendarDropdown({ options, className, ...selectProps }: DropdownProps) {
  const selected = options?.find(
    (option) => option.value === Number(selectProps.value)
  )

  return (
    <span className={dropdownRootClasses}>
      <span className={dropdownLabelClasses}>{selected?.label}</span>
      <span className={dropdownChevronWrapClasses} aria-hidden="true">
        <ChevronDownIcon className="size-3.5" />
      </span>
      <select
        className={cn(dropdownSelectOverlayClasses, className)}
        {...selectProps}
      >
        {options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-haiti text-blue-chalk"
          >
            {option.label}
          </option>
        ))}
      </select>
    </span>
  )
}

type CalendarComponents = NonNullable<
  React.ComponentProps<typeof DayPicker>["components"]
>

const CalendarRoot: CalendarComponents["Root"] = ({ className, rootRef, ...props }) => (
  <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
)

const CalendarChevron: CalendarComponents["Chevron"] = ({ className, orientation, ...props }) => {
  if (orientation === "left") {
    return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
  }
  if (orientation === "right") {
    return <ChevronRightIcon className={cn("size-4", className)} {...props} />
  }
  return <ChevronDownIcon className={cn("size-4", className)} {...props} />
}

const CalendarWeekNumber: CalendarComponents["WeekNumber"] = ({ children, ...props }) => (
  <td {...props}>
    <div className="flex size-(--cell-size) items-center justify-center text-center">
      {children}
    </div>
  </td>
)

const CalendarOption: CalendarComponents["Option"] = ({ className, ...props }) => (
  <option className={cn("bg-haiti text-blue-chalk", className)} {...props} />
)

function isDropdownCaptionLayout(
  layout: React.ComponentProps<typeof DayPicker>["captionLayout"]
) {
  return (
    layout === "dropdown" ||
    layout === "dropdown-months" ||
    layout === "dropdown-years"
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant: _buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: "ghost"
}) {
  const defaultClassNames = getDefaultClassNames()
  const dropdownCaption = isDropdownCaptionLayout(captionLayout)
  void _buttonVariant

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "long" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          dropdownCaption
            ? "hidden"
            : "pointer-events-none absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          navButtonClasses,
          "pointer-events-auto relative z-10",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          navButtonClasses,
          "pointer-events-auto relative z-10",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          dropdownCaption
            ? "relative z-0 flex h-(--cell-size) w-full items-center justify-center text-center"
            : "relative z-0 flex h-(--cell-size) w-full items-center justify-center px-(--cell-size) text-center",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          dropdownCaption ? dropdownRootClasses : "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 z-10 cursor-pointer opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none",
          captionLayout === "label"
            ? "font-sans text-sm font-semibold text-blue-chalk"
            : "pointer-events-none flex items-center justify-center gap-1 px-2 py-1 font-sans text-xs font-medium text-blue-chalk [&>svg]:size-3.5 [&>svg]:text-prelude",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown,
        WeekNumber: CalendarWeekNumber,
        Option: CalendarOption,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  color: _dayColor,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  void _dayColor

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      type="button"
      ref={ref}
      data-day={formatDisplayDate(day.date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        dayButtonClasses,
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-aquamarine/40",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
