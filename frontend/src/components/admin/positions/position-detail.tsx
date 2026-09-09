"use client"

import { Button } from "@/components/ui/button"
import type { Committee, Position } from "@/components/admin/positions/mock-data"

type PositionDetailProps = {
  position: Position | null
  committee: Committee | undefined
  onEdit: (position: Position) => void
  onDelete: (position: Position) => void
}

const panelClasses =
  "glass flex h-fit flex-col gap-5 rounded-[14px] border border-blue-chalk/15 bg-meteorite/55 p-5 lg:sticky lg:top-24"
const emptyClasses = "font-sans text-sm leading-relaxed text-prelude"
const committeeEyebrowClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const titleClasses = "font-sans text-2xl font-bold text-blue-chalk"
const sectionLabelClasses =
  "font-mono text-xs font-medium uppercase tracking-wide text-prelude"
const bodyClasses = "font-sans text-sm leading-relaxed text-prelude"
const listClasses =
  "flex list-disc flex-col gap-2 pl-4 font-sans text-sm text-prelude"
const actionsClasses = "flex flex-wrap gap-2 pt-2"

export function PositionDetail({
  position,
  committee,
  onEdit,
  onDelete,
}: PositionDetailProps) {
  if (!position) {
    return (
      <aside className={panelClasses}>
        <p className={emptyClasses}>
          Select a position to see the full description on the right.
        </p>
      </aside>
    )
  }

  return (
    <aside className={panelClasses}>
      <div className="flex flex-col gap-2">
        <p className={committeeEyebrowClasses}>{committee?.name}</p>
        <h3 className={titleClasses}>{position.name}</h3>
      </div>

      {committee?.description ? (
        <div className="flex flex-col gap-2">
          <p className={sectionLabelClasses}>Committee description</p>
          <p className={bodyClasses}>{committee.description}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className={sectionLabelClasses}>Position description</p>
        <p className={bodyClasses}>
          {position.description || "No description."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className={sectionLabelClasses}>Responsibilities</p>
        {position.responsibilities.length > 0 ? (
          <ul className={listClasses}>
            {position.responsibilities.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className={bodyClasses}>No responsibilities listed.</p>
        )}
      </div>

      <div className={actionsClasses}>
        <Button color="purple" onClick={() => onEdit(position)}>
          Edit
        </Button>
        <Button color="danger" onClick={() => onDelete(position)}>
          Delete
        </Button>
      </div>
    </aside>
  )
}
