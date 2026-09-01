"use client"

import { cn } from "@/lib/utils"
import type { Committee, Position } from "@/components/admin/positions/mock-data"

type PositionListProps = {
  committees: Committee[]
  positions: Position[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const listClasses = "flex flex-col gap-8"
const groupClasses = "flex flex-col gap-3"
const groupTitleClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const positionsGroupClasses = "flex flex-col gap-3 pl-5 sm:pl-6"
const cardClasses =
  "glass w-full rounded-[14px] border border-blue-chalk/15 bg-meteorite/55 p-4 text-left transition-colors hover:border-biloba-flower/40"
const cardSelectedClasses = "border-aquamarine/40 bg-meteorite/80"
const nameClasses = "font-sans text-sm font-semibold text-blue-chalk"
const descriptionClasses = "mt-1 line-clamp-2 font-sans text-sm text-prelude"
const emptyClasses = "font-mono text-sm text-prelude/70"

export function PositionList({
  committees,
  positions,
  selectedId,
  onSelect,
}: PositionListProps) {
  return (
    <div className={listClasses}>
      {committees.map((committee) => {
        const group = positions.filter((p) => p.committeeId === committee.id)

        return (
          <section key={committee.id} className={groupClasses}>
            <h3 className={groupTitleClasses}>{committee.name}</h3>

            {group.length === 0 ? (
              <p className={cn(emptyClasses, "pl-5 sm:pl-6")}>
                No positions in this committee.
              </p>
            ) : (
              <ul className={positionsGroupClasses}>
                {group.map((position) => {
                  const selected = position.id === selectedId

                  return (
                    <li key={position.id}>
                      <button
                        type="button"
                        className={cn(cardClasses, selected && cardSelectedClasses)}
                        aria-current={selected ? "true" : undefined}
                        onClick={() => onSelect(position.id)}
                      >
                        <p className={nameClasses}>{position.name}</p>
                        <p className={descriptionClasses}>
                          {position.description || "No description."}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
