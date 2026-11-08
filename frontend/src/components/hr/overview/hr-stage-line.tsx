import Link from "next/link"
import type { StageStation } from "@/lib/hr/overview"
import { cn } from "@/lib/utils"

const listClasses = "flex flex-col"
const stationClasses = [
  "relative flex gap-4 pb-1 last:pb-0",
  // The line runs on to the next station; only the station that needs work is accented.
  "before:absolute before:left-[11px] before:top-[34px] before:h-6 before:w-0.5 before:bg-blue-chalk/15 last:before:hidden",
  "data-[state=done]:before:bg-blue-chalk/40",
].join(" ")
const markerClasses = "relative z-10 mt-2.5 grid size-6 shrink-0 place-items-center"
const dotByState = {
  done: "size-3 bg-blue-chalk",
  current: "size-5 bg-aquamarine",
  ahead: "size-3 border-2 border-prelude/60 bg-haiti",
  idle: "size-3 border-2 border-prelude/60 bg-haiti",
} as const
const linkClasses =
  "flex min-h-11 flex-1 items-center justify-between gap-3 rounded-md outline-none transition-colors hover:text-aquamarine focus-visible:ring-2 focus-visible:ring-aquamarine/60"
const labelClasses = "font-sans text-sm font-medium"
const countClasses = "font-sans text-xl font-semibold tabular-nums"
const colorByState = {
  done: "text-blue-chalk",
  current: "text-aquamarine",
  ahead: "text-prelude",
  idle: "text-blue-chalk",
} as const

export function HrStageLine({ stations }: { stations: StageStation[] }) {
  return (
    <nav aria-label="Recruitment stages">
      <ol className={listClasses}>
        {stations.map((station) => (
          <li key={station.key} className={stationClasses} data-state={station.state}>
            <span className={markerClasses} aria-hidden>
              <span className={cn("block rounded-full", dotByState[station.state])} />
            </span>
            <Link href={station.href} className={cn(linkClasses, colorByState[station.state])}>
              <span className={labelClasses}>
                {station.label}
                {station.needsWork ? <span className="sr-only"> (needs work)</span> : null}
              </span>
              <span className={countClasses}>{station.count}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
