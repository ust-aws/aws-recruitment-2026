"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  interviewTimeLabels,
  INTERVIEW_GRID_END_HOUR,
  INTERVIEW_GRID_START_HOUR,
  slotKey,
  slotStartsAt,
} from "@/lib/interview-season"

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
  loading?: boolean
  sparse?: boolean
  scrollable?: boolean
  scrollShellClassName?: string
  emptyMessage?: string
}

const shellBaseClasses = "rounded-[20px] border border-biloba-flower/25"
const shellWideClasses = "overflow-x-auto"
const stickyHeaderClasses =
  "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-meteorite/95 [&_thead_th:first-child]:z-30"
const tableWideClasses = "min-w-full border-collapse text-left"
const tableScrollClasses = "w-full table-fixed border-collapse text-left"
const timeColumnClasses =
  "bg-meteorite/95 px-1 text-center sm:px-2"
const timeColumnWideClasses = `${timeColumnClasses} sticky left-0 z-10 w-[4.75rem] min-w-[4.75rem]`
const timeColumnScrollClasses = `${timeColumnClasses} w-[14%]`
const dayHeaderWideClasses =
  "min-w-[5.5rem] px-2 py-2 text-center font-sans text-xs font-semibold text-blue-chalk"
const dayHeaderScrollClasses =
  "min-w-0 px-0.5 py-2 text-center font-sans text-[0.7rem] font-semibold leading-tight text-blue-chalk sm:px-1 sm:text-xs"
const daySubheaderClasses = "block font-mono text-[0.6rem] font-normal text-prelude sm:text-[0.65rem]"
const cellWideClasses =
  "h-9 min-w-[5.5rem] border border-haiti/40 px-1 transition-colors"
const cellScrollClasses =
  "h-9 min-w-0 border border-haiti/40 px-0.5 transition-colors"
const unavailableClasses = "bg-haiti/30 cursor-pointer hover:bg-haiti/50"
const availableClasses =
  "cursor-pointer bg-aquamarine/25 hover:bg-aquamarine/40"
const bookedClasses = "cursor-not-allowed bg-biloba-flower/35 text-prelude"
const selectedClasses = "cursor-pointer bg-aquamarine ring-2 ring-aquamarine/70"
const currentClasses = "cursor-pointer bg-aquamarine/50 ring-2 ring-aquamarine"
const hiddenClasses = "bg-transparent border-transparent"
const legendClasses = "mt-3 flex flex-wrap gap-4 font-sans text-xs text-prelude"
const legendSwatchClasses = "mr-2 inline-block size-3 rounded-sm align-middle"
const emptyClasses = "px-4 py-8 text-center font-sans text-sm text-prelude"

function cellClasses(state: SlotGridCellState, scrollable: boolean): string {
  const base = scrollable ? cellScrollClasses : cellWideClasses
  switch (state) {
    case "unavailable":
      return `${base} ${unavailableClasses}`
    case "available":
      return `${base} ${availableClasses}`
    case "booked":
      return `${base} ${bookedClasses}`
    case "selected":
      return `${base} ${selectedClasses}`
    case "current":
      return `${base} ${currentClasses}`
    default:
      return `${base} ${hiddenClasses}`
  }
}

function formatDayHeader(day: Date) {
  return {
    weekday: day.toLocaleDateString(undefined, { weekday: "short" }),
    date: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }
}

export function SlotGrid({
  days,
  cells,
  onCellClick,
  loading = false,
  sparse = false,
  scrollable = false,
  scrollShellClassName,
  emptyMessage = "No slots to show.",
}: SlotGridProps) {
  const timeLabels = interviewTimeLabels()
  const rowCount =
    (INTERVIEW_GRID_END_HOUR - INTERVIEW_GRID_START_HOUR) * 2

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

  const scrollShell =
    scrollShellClassName ??
    "max-h-[min(32rem,55vh)] overflow-x-hidden overflow-y-auto overscroll-contain"
  const shellClasses = scrollable
    ? `${shellBaseClasses} ${scrollShell} ${stickyHeaderClasses}`
    : `${shellBaseClasses} ${shellWideClasses}`
  const tableClasses = scrollable ? tableScrollClasses : tableWideClasses
  const headerClasses = `${
    scrollable ? timeColumnScrollClasses : timeColumnWideClasses
  } py-2 font-mono text-[0.65rem] uppercase tracking-wide text-prelude`
  const timeLabelClasses = `${
    scrollable ? timeColumnScrollClasses : timeColumnWideClasses
  } py-1 font-mono text-[0.65rem] text-prelude whitespace-nowrap`
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
                          className={`${scrollable ? cellScrollClasses : cellWideClasses} ${hiddenClasses}`}
                        />
                      )
                    }
                    const fallback: SlotGridCell = {
                      key: slotKey(startsAt),
                      startsAt,
                      state: "unavailable",
                    }
                    return (
                      <td
                        key={fallback.key}
                        className={cellClasses("unavailable", scrollable)}
                      >
                        <button
                          type="button"
                          className="size-full cursor-pointer"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onCellClick?.(fallback)}
                          aria-label={`Unavailable ${startsAt.toLocaleString()}`}
                        />
                      </td>
                    )
                  }

                  const clickable =
                    cell.state === "unavailable" ||
                    cell.state === "available" ||
                    cell.state === "selected" ||
                    cell.state === "current"

                  return (
                    <td key={cell.key} className={cellClasses(cell.state, scrollable)}>
                      {clickable ? (
                        <button
                          type="button"
                          className="flex size-full flex-col items-center justify-center px-1 text-[0.65rem] leading-tight text-blue-chalk"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onCellClick?.(cell)}
                          aria-label={cell.detail ?? cell.startsAt.toLocaleString()}
                          title={cell.detail}
                        >
                          {cell.detail ? (
                            <span className="line-clamp-2">{cell.detail}</span>
                          ) : null}
                        </button>
                      ) : (
                        <span
                          className="flex size-full items-center justify-center px-1 text-[0.65rem] leading-tight"
                          title={cell.detail}
                        >
                          {cell.detail ? (
                            <span className="line-clamp-2">{cell.detail}</span>
                          ) : null}
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
          <span className={`${legendSwatchClasses} bg-aquamarine/30`} />
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
}
