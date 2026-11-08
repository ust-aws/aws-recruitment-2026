import Link from "next/link"
import type { PeriodState, ScheduleRow } from "@/lib/hr/overview-schedule"
import {
  dashboardDividerClasses,
  dashboardPanelClasses,
  dashboardRowTargetClasses,
} from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const headingClasses = "font-sans text-lg font-semibold text-blue-chalk"
const listClasses = cn(dashboardPanelClasses, dashboardDividerClasses, "mt-4 overflow-hidden")
const rowClasses = cn(
  dashboardRowTargetClasses,
  "flex items-start justify-between gap-4 px-5 py-4 outline-none transition-colors hover:bg-blue-chalk/5 focus-visible:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aquamarine/60"
)
const labelClasses = "font-sans text-sm font-semibold text-blue-chalk"
const rangeClasses = "mt-1 font-sans text-xs text-prelude"
const noteBase = "flex shrink-0 items-center gap-2 pt-0.5 text-right font-sans text-xs"
const noteByState: Record<PeriodState, string> = {
  open: "font-semibold text-blue-chalk",
  upcoming: "text-blue-chalk",
  closed: "text-prelude",
  "not-set": "text-rose-glow",
}
const openDotClasses = "size-2 shrink-0 rounded-full bg-blue-chalk"

export function HrSeasonSchedule({ rows }: { rows: ScheduleRow[] }) {
  return (
    <section aria-labelledby="schedule-heading">
      <h3 id="schedule-heading" className={headingClasses}>
        Schedule
      </h3>
      <ul className={listClasses}>
        {rows.map((row) => (
          <li key={row.key}>
            <Link href={row.href} className={rowClasses}>
              <span className="min-w-0">
                <span className={cn(labelClasses, "block")}>{row.label}</span>
                <span className={cn(rangeClasses, "block")}>{row.range ?? "No dates yet"}</span>
              </span>
              <span className={cn(noteBase, noteByState[row.state])}>
                {row.state === "open" ? <span aria-hidden className={openDotClasses} /> : null}
                {row.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
