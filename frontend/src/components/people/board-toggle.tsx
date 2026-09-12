"use client"

import { cn } from "@/lib/utils"

export type PeopleView = "executive-board" | "committee-directors"

const shellClasses = "flex flex-wrap gap-2"
const tabClasses =
  "cursor-pointer rounded-pill px-5 py-2.5 font-mono text-xs transition-[background-color,border-color,box-shadow,transform,color] duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
const activeTabClasses =
  "bg-aquamarine text-haiti hover:bg-aquamarine/95 hover:shadow-[0_0_24px_rgba(90,240,192,0.45)] active:scale-[0.98]"
const inactiveTabClasses =
  "border border-biloba-flower/35 bg-daisy-bush/40 text-prelude hover:border-biloba-flower/55 hover:bg-biloba-flower/15 hover:text-blue-chalk hover:shadow-[0_0_20px_rgba(183,140,240,0.2)] active:scale-[0.98]"

type BoardToggleProps = {
  value: PeopleView
  onChange: (value: PeopleView) => void
}

export function BoardToggle({ value, onChange }: BoardToggleProps) {
  return (
    <div className={shellClasses} role="tablist" aria-label="People directory">
      <button
        type="button"
        role="tab"
        aria-selected={value === "executive-board"}
        className={cn(
          tabClasses,
          value === "executive-board" ? activeTabClasses : inactiveTabClasses
        )}
        onClick={() => onChange("executive-board")}
      >
        Executive Boards
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "committee-directors"}
        className={cn(
          tabClasses,
          value === "committee-directors" ? activeTabClasses : inactiveTabClasses
        )}
        onClick={() => onChange("committee-directors")}
      >
        Committee Directors
      </button>
    </div>
  )
}
