"use client"

import { memo, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
} from "@/lib/datetime/display"
import {
  INTERVIEW_TIME_LABELS,
  INTERVIEW_GRID_END_HOUR,
  INTERVIEW_GRID_START_HOUR,
  INTERVIEW_SLOT_MINUTES,
  slotKey,
  slotStartsAt,
} from "@/lib/season/interview"

export type SlotGridCellState =
  | "hidden"
  | "unavailable"
  | "available"
  | "booked"
  | "selected"
  | "current"

export type SlotGridCell = {
  key: string
  startsAt: Date
  state: SlotGridCellState
  slotId?: string
  detail?: string
}

type SlotGridProps = {
  days: Date[]
  cells: Map<string, SlotGridCell>
  onCellClick?: (cell: SlotGridCell) => void
  onCellPointerDown?: (cell: SlotGridCell) => void
  onCellPointerEnter?: (cell: SlotGridCell) => void
  draggedCellKeys?: ReadonlySet<string>
  loading?: boolean
  sparse?: boolean
  scrollable?: boolean
  scrollShellClassName?: string
  emptyMessage?: string
}

const shellBaseClasses = "rounded-[20px] border border-biloba-flower/25"
const shellWideClasses = "overflow-x-auto"
const shellScrollClasses =
  "max-h-[min(36rem,62vh)] overflow-x-auto overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y]"
const stickyHeaderClasses =
  "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-meteorite/95 [&_thead_th:first-child]:z-30"
const stickyTimeColumnClasses =
  "sticky left-0 z-10 bg-meteorite/95 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.45)]"
const tableWideClasses = "min-w-full border-collapse text-left"
const tableScrollClasses = "w-max min-w-full border-collapse text-left"
const timeColumnClasses = "border border-blue-chalk/25 px-1 text-center sm:px-2"
const timeColumnWideClasses = `${timeColumnClasses} ${stickyTimeColumnClasses} w-[4.75rem] min-w-[4.75rem] max-w-[4.75rem]`
const timeColumnScrollClasses = `${timeColumnClasses} ${stickyTimeColumnClasses} w-[4.25rem] min-w-[4.25rem] max-w-[4.25rem] sm:w-[4.75rem] sm:min-w-[4.75rem] sm:max-w-[4.75rem]`
const dayHeaderWideClasses =
  "min-w-[5rem] border border-blue-chalk/25 px-1.5 py-1.5 text-center font-sans text-xs font-semibold text-blue-chalk"
const dayHeaderScrollClasses =
  "min-w-[4.75rem] border border-blue-chalk/25 px-1 py-1.5 text-center font-sans text-[0.65rem] font-semibold leading-tight text-blue-chalk sm:min-w-[5.5rem] sm:px-1.5 sm:text-xs"
const daySubheaderClasses =
  "block font-mono text-[0.55rem] font-normal text-prelude sm:text-[0.65rem]"
const cellWideClasses =
  "relative h-10 min-w-[5rem] border border-blue-chalk/25 p-0"
const cellScrollClasses =
  "relative h-10 min-w-[4.75rem] border border-blue-chalk/25 p-0 sm:min-w-[5.5rem]"
const slotButtonClasses =
  "absolute inset-0 flex touch-manipulation flex-col items-center justify-center p-0.5 text-blue-chalk transition-colors"
const unavailableClasses =
  "cursor-pointer bg-haiti/30 hover:bg-haiti/50 active:bg-haiti/60"
const availableClasses =
  "cursor-pointer bg-aquamarine/40 ring-1 ring-inset ring-aquamarine/50 hover:bg-aquamarine/55 active:bg-aquamarine/65"
const bookedClasses = "cursor-not-allowed bg-biloba-flower/35 text-prelude"
const selectedClasses =
  "cursor-pointer bg-aquamarine text-haiti ring-2 ring-inset ring-aquamarine shadow-[0_0_0_1px_var(--haiti)]"
const currentClasses =
  "cursor-pointer bg-aquamarine/60 ring-2 ring-inset ring-aquamarine"
const draggedClasses = "ring-2 ring-inset ring-aquamarine/80"
const hiddenClasses = "bg-transparent border-transparent"
const slotTimeClasses =
  "pointer-events-none flex flex-col items-center font-mono text-[0.5rem] leading-none sm:text-[0.6rem] sm:leading-tight"
const slotDetailClasses =
  "pointer-events-none line-clamp-2 max-w-full break-words text-center text-[0.5rem] leading-tight sm:text-[0.6rem]"
const clockOpts = { hour: "numeric", minute: "2-digit" } as const
const legendClasses = "mt-3 flex flex-wrap gap-4 font-sans text-xs text-prelude"
const legendSwatchClasses = "mr-2 inline-block size-3 rounded-sm align-middle"
const emptyClasses = "px-4 py-8 text-center font-sans text-sm text-prelude"

function cellTdClasses(scrollable: boolean): string {
  return scrollable ? cellScrollClasses : cellWideClasses
}

function slotButtonStateClasses(state: SlotGridCellState): string {
  switch (state) {
    case "unavailable":
      return unavailableClasses
    case "available":
      return availableClasses
    case "booked":
      return bookedClasses
    case "selected":
      return selectedClasses
    case "current":
      return currentClasses
    default:
      return hiddenClasses
  }
}

function slotEndsAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() + INTERVIEW_SLOT_MINUTES * 60_000)
}

function formatSlotClockRange(startsAt: Date): string {
  return `${formatDisplayTime(startsAt, clockOpts)} – ${formatDisplayTime(slotEndsAt(startsAt), clockOpts)}`
}

function slotButtonLabel(
  state: SlotGridCellState,
  startsAt: Date,
  detail?: string,
) {
  if (detail) {
    return <span className={slotDetailClasses}>{detail}</span>
  }
  if (
    state !== "available" &&
    state !== "selected" &&
    state !== "current"
  ) {
    return null
  }
  return (
    <span className={slotTimeClasses}>
      <span>{formatDisplayTime(startsAt, clockOpts)}</span>
      <span>– {formatDisplayTime(slotEndsAt(startsAt), clockOpts)}</span>
    </span>
  )
}

function formatDayHeader(day: Date) {
  return {
    weekday: formatDisplayDate(day, { weekday: "short" }),
    date: formatDisplayDate(day, { month: "short", day: "numeric" }),
  }
}

export const SlotGrid = memo(function SlotGrid({
  days,
  cells,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  draggedCellKeys,
  loading = false,
  sparse = false,
  scrollable = false,
  scrollShellClassName,
  emptyMessage = "No slots to show.",
}: SlotGridProps) {
  const timeLabels = INTERVIEW_TIME_LABELS
  const rowCount =
    (INTERVIEW_GRID_END_HOUR - INTERVIEW_GRID_START_HOUR) * 2
  const suppressNextClickRef = useRef(false)

  function onSlotClick(cell: SlotGridCell) {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    onCellClick?.(cell)
  }

  function onSlotPointerDown(cell: SlotGridCell) {
    if (!onCellPointerDown) return
    suppressNextClickRef.current = true
    onCellPointerDown(cell)
  }

  function slotClasses(cell: SlotGridCell) {
    return `${slotButtonClasses} ${slotButtonStateClasses(cell.state)} ${
      draggedCellKeys?.has(cell.key) ? draggedClasses : ""
    }`
  }

  if (loading) {
    return (
      <Skeleton
        className="h-48 rounded-[20px]"
        role="status"
        aria-busy="true"
        aria-label="Loading interview slots"
      />
    )
  }

  if (days.length === 0) {
    return <p className={emptyClasses}>{emptyMessage}</p>
  }

  const visibleCells = sparse
    ? [...cells.values()].filter((cell) => cell.state !== "hidden")
    : null

  if (sparse && visibleCells && visibleCells.length === 0) {
    return <p className={emptyClasses}>{emptyMessage}</p>
  }

  const scrollShell = scrollShellClassName ?? shellScrollClasses
  const shellClasses = scrollable
    ? `${shellBaseClasses} ${scrollShell} ${stickyHeaderClasses}`
    : `${shellBaseClasses} ${shellWideClasses}`
  const tableClasses = scrollable ? tableScrollClasses : tableWideClasses
  const headerClasses = `${
    scrollable ? timeColumnScrollClasses : timeColumnWideClasses
  } py-2 font-mono text-[0.65rem] uppercase tracking-wide text-prelude`
  const timeLabelClasses = `${
    scrollable ? timeColumnScrollClasses : timeColumnWideClasses
  } py-1 font-mono text-[0.6rem] text-prelude whitespace-nowrap sm:text-[0.65rem]`
  const dayHeaderClasses = scrollable
    ? dayHeaderScrollClasses
    : dayHeaderWideClasses

  return (
    <div className="min-w-0 w-full">
      <div className={shellClasses}>
        <table className={tableClasses}>
          <thead>
            <tr>
              <th className={headerClasses} scope="col">Time</th>
              {days.map((day) => {
                const { weekday, date } = formatDayHeader(day)
                return (
                  <th key={day.toISOString()} className={dayHeaderClasses} scope="col">
                    {weekday}
                    <span className={daySubheaderClasses}>{date}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <tr key={rowIndex}>
                <th className={timeLabelClasses} scope="row">
                  {timeLabels[rowIndex]}
                </th>
                {days.map((day) => {
                  const startsAt = slotStartsAt(day, rowIndex)
                  const cell = cells.get(slotKey(startsAt))
                  if (!cell || (sparse && cell.state === "hidden")) {
                    if (sparse) {
                      return (
                        <td
                          key={`${day.toISOString()}-${rowIndex}`}
                          className={`${cellTdClasses(scrollable)} ${hiddenClasses}`}
                        />
                      )
                    }
                    const fallback: SlotGridCell = {
                      key: slotKey(startsAt),
                      startsAt,
                      state: "unavailable",
                    }
                    return (
                      <td key={fallback.key} className={cellTdClasses(scrollable)}>
                        <button
                          type="button"
                          className={slotClasses(fallback)}
                          onClick={() => onSlotClick(fallback)}
                          onPointerDown={(event) => {
                            if (!onCellPointerDown) return
                            event.preventDefault()
                            onSlotPointerDown(fallback)
                          }}
                          onPointerEnter={() => onCellPointerEnter?.(fallback)}
                          aria-label={`Unavailable ${formatDisplayDateTime(startsAt, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`}
                        />
                      </td>
                    )
                  }

                  const clickable =
                    cell.state === "unavailable" ||
                    cell.state === "available" ||
                    cell.state === "selected" ||
                    cell.state === "current"

                  const rangeLabel = formatSlotClockRange(cell.startsAt)
                  const ariaLabel = cell.detail
                    ? `${rangeLabel}. ${cell.detail}`
                    : rangeLabel

                  return (
                    <td key={cell.key} className={cellTdClasses(scrollable)}>
                      {clickable ? (
                        <button
                          type="button"
                          className={slotClasses(cell)}
                          onClick={() => onSlotClick(cell)}
                          onPointerDown={(event) => {
                            if (!onCellPointerDown) return
                            event.preventDefault()
                            onSlotPointerDown(cell)
                          }}
                          onPointerEnter={() => onCellPointerEnter?.(cell)}
                          aria-label={ariaLabel}
                          aria-pressed={
                            cell.state === "selected" || cell.state === "current"
                              ? true
                              : undefined
                          }
                          title={ariaLabel}
                        >
                          {slotButtonLabel(cell.state, cell.startsAt, cell.detail)}
                        </button>
                      ) : (
                        <span
                          className={slotClasses(cell)}
                          title={ariaLabel}
                        >
                          {slotButtonLabel(cell.state, cell.startsAt, cell.detail)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={legendClasses} aria-hidden="true">
        <span>
          <span className={`${legendSwatchClasses} bg-haiti/50`} />
          Unavailable
        </span>
        <span>
          <span className={`${legendSwatchClasses} bg-aquamarine/40 ring-1 ring-inset ring-aquamarine/50`} />
          Available
        </span>
        <span>
          <span className={`${legendSwatchClasses} bg-biloba-flower/40`} />
          Booked
        </span>
        <span>
          <span className={`${legendSwatchClasses} bg-aquamarine`} />
          Selected
        </span>
      </div>
    </div>
  )
})
