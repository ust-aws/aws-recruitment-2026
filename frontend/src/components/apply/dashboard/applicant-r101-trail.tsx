import type { CSSProperties } from "react"
import type { R101Trail, TrailMood } from "@/lib/apply/r101-trail"
import { cn } from "@/lib/utils"

// The R101 path as a line of stations under the applicant's name. The filled
// line runs from the first station to "you are here", drawn on load; a station
// that needs the applicant is the only aquamarine thing on it.
const trailClasses = "relative mt-5"
const listClasses = "relative grid"
// The track runs between the first and last station centres (half a column in).
const trackClasses = "absolute top-[7px] h-0 border-t-2 border-dashed border-blue-chalk/20"
const fillClasses = "trail-fill absolute left-0 top-[-2px] h-0.5 rounded-full bg-biloba-flower"
const stationClasses = "relative flex min-w-0 flex-col items-center gap-2 text-center"
const dotBaseClasses = "relative z-10 grid size-4 place-items-center rounded-full"
const doneDotClasses = "bg-biloba-flower"
const aheadDotClasses = "border border-blue-chalk/30 bg-haiti"
const currentDotClasses: Record<TrailMood, string> = {
  action: "bg-aquamarine ring-4 ring-aquamarine/20",
  waiting: "bg-biloba-flower ring-4 ring-biloba-flower/20",
  problem: "bg-rose-glow ring-4 ring-rose-glow/20",
  complete: "bg-biloba-flower ring-4 ring-biloba-flower/25",
}
const beaconClasses = "trail-beacon absolute inset-0 rounded-full bg-aquamarine"
const innerDotClasses = "size-1.5 rounded-full bg-haiti"
const labelBaseClasses = "font-sans text-xs leading-tight text-balance"
const labelClasses = {
  done: "text-prelude max-[359px]:sr-only",
  current: "font-semibold text-blue-chalk",
  ahead: "text-prelude/75 max-[359px]:sr-only",
}

type StationState = keyof typeof labelClasses

function stationState(index: number, current: number): StationState {
  if (index < current) return "done"
  return index === current ? "current" : "ahead"
}

export function ApplicantR101Trail({ trail }: { trail: R101Trail }) {
  const count = trail.stations.length
  const inset = `${50 / count}%`
  const fillWidth = `${(trail.current / (count - 1)) * 100}%`
  const trackStyle: CSSProperties = { left: inset, right: inset }

  return (
    <div className={trailClasses}>
      <span className={trackClasses} style={trackStyle} aria-hidden>
        <span className={fillClasses} style={{ width: fillWidth }} />
      </span>
      <ol
        className={listClasses}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-label="Your application progress"
      >
        {trail.stations.map((label, index) => {
          const state = stationState(index, trail.current)
          return (
            <li key={label} className={stationClasses} aria-current={state === "current" ? "step" : undefined}>
              <span
                className={cn(
                  dotBaseClasses,
                  state === "done" && doneDotClasses,
                  state === "ahead" && aheadDotClasses,
                  state === "current" && currentDotClasses[trail.mood],
                )}
                aria-hidden
              >
                {state === "current" && trail.mood === "action" ? <span className={beaconClasses} /> : null}
                {state === "current" ? <span className={innerDotClasses} /> : null}
              </span>
              <span className={cn(labelBaseClasses, labelClasses[state])}>
                {label}
                {state === "done" ? <span className="sr-only"> (done)</span> : null}
                {state === "current" ? <span className="sr-only"> (you are here)</span> : null}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
