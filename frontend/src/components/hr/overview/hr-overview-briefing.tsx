import type { Briefing } from "@/lib/hr/overview-briefing"

const headlineClasses =
  "max-w-3xl text-balance font-sans text-2xl font-semibold leading-tight text-blue-chalk"
const lineClasses = "max-w-2xl font-sans text-base leading-snug text-prelude"
const wrapClasses = "flex flex-col gap-3"

export function HrOverviewBriefing({ briefing }: { briefing: Briefing }) {
  return (
    <div className={wrapClasses}>
      <p className={headlineClasses}>{briefing.headline}</p>
      {briefing.lines.map((line) => (
        <p key={line} className={lineClasses}>
          {line}
        </p>
      ))}
    </div>
  )
}
