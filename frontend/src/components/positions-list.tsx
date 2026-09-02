import { cn } from "@/lib/utils"
import type { Position } from "@/lib/positions"
import {
  groupPositionsByOffice,
  isAssistantRole,
  OFFICE_CODE,
  openSpots,
} from "@/lib/positions"

const listClasses =
  "panel-scroll flex max-h-[min(72vh,46rem)] flex-col gap-6 overflow-y-auto border-blue-chalk/15 p-4 lg:border-r"
const officeLabelClasses =
  "font-mono text-[11px] uppercase tracking-wide text-aquamarine"
const rowClasses =
  "relative w-full cursor-pointer rounded-[14px] border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-biloba-flower/10"
const activeRowClasses =
  "border-aquamarine/35 bg-aquamarine/10 shadow-[inset_3px_0_0_0_var(--aquamarine)]"
const titleRowClasses = "flex items-start justify-between gap-2"
const titleClasses = "font-sans text-sm font-medium text-blue-chalk"
const snippetClasses = "mt-1 font-sans text-xs leading-relaxed text-prelude"
const spotsClasses = "mt-2 font-mono text-[10px] uppercase tracking-wide text-aquamarine"
const pillClasses =
  "shrink-0 rounded-pill border border-biloba-flower/35 bg-daisy-bush/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-blue-chalk"
const assistantPillClasses =
  "border-aquamarine/40 bg-aquamarine/15 text-aquamarine"

type PositionsListProps = {
  positions: Position[]
  selectedId: string
  onSelect: (id: string) => void
}

export function PositionsList({
  positions,
  selectedId,
  onSelect,
}: PositionsListProps) {
  const groups = groupPositionsByOffice(positions)

  return (
    <nav aria-label="Open positions" className={listClasses}>
      {groups.map((group) => (
        <div key={group.office} className="flex flex-col gap-2">
          <p className={officeLabelClasses} title={group.office}>
            $ office/{OFFICE_CODE[group.office] ?? "org"}
          </p>
          <ul className="flex flex-col gap-1">
            {group.positions.map((position) => {
              const selected = selectedId === position.id
              const assistant = isAssistantRole(position)
              const spots = openSpots(position)
              const snippet =
                position.description.length > 88
                  ? `${position.description.slice(0, 88).trim()}…`
                  : position.description

              return (
                <li key={position.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(position.id)}
                    className={cn(rowClasses, selected && activeRowClasses)}
                  >
                    <span className={titleRowClasses}>
                      <span className={titleClasses}>{position.title}</span>
                      <span
                        className={cn(
                          pillClasses,
                          assistant && assistantPillClasses
                        )}
                      >
                        {assistant ? "assistant" : "staff"}
                      </span>
                    </span>
                    <p className={snippetClasses}>{snippet}</p>
                    <p className={spotsClasses}>
                      {spots} {spots === 1 ? "spot" : "spots"} available
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
