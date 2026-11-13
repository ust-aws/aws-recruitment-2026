"use client"

import { useEffect, useMemo, useState } from "react"
import { HrOverviewBriefing } from "@/components/hr/overview/hr-overview-briefing"
import { HrSeasonSchedule } from "@/components/hr/season/hr-season-schedule"
import { HrStageLine } from "@/components/hr/overview/hr-stage-line"
import { HrWorklist } from "@/components/hr/overview/hr-worklist"
import { SectionHeader } from "@/components/shared/section-header"
import { getSeasonOverview, type SeasonOverview } from "@/lib/api/overview"
import { buildStations } from "@/lib/hr/overview"
import { buildBriefing } from "@/lib/hr/overview-briefing"
import { buildSchedule } from "@/lib/hr/overview-schedule"
import { buildTasks } from "@/lib/hr/overview-tasks"
import { dashboardTitleClasses } from "@/lib/site/dashboard-surface"
import { hrPageShellClasses } from "@/lib/site/surface"

// One column on small screens: briefing and worklist, then the schedule, then the
// stage line. From xl the schedule and the stage line stack in a rail beside them.
const layoutClasses =
  "mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_21rem] xl:grid-rows-[auto_1fr] xl:gap-x-14"
const mainColumnClasses = "flex min-w-0 flex-col gap-12 xl:col-start-1 xl:row-span-2"
const scheduleClasses = "min-w-0 xl:col-start-2 xl:row-start-1"
const seasonClasses = "min-w-0 xl:col-start-2 xl:row-start-2 xl:self-start"
const seasonHeadingClasses = "font-sans text-lg font-semibold text-blue-chalk"
const statusClasses = "mt-10 font-sans text-sm text-prelude"
const errorClasses = "mt-10 font-sans text-sm text-rose-glow"

function seasonSubtitle(year: number) {
  return `Recruitment ${year} · A.Y. ${year}–${year + 1}`
}

export function HrOverviewPage() {
  const [overview, setOverview] = useState<SeasonOverview | null>(null)
  const [error, setError] = useState("")
  const [now] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    getSeasonOverview()
      .then((result) => {
        if (!cancelled) setOverview(result)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load the overview.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const view = useMemo(
    () =>
      overview && {
        briefing: buildBriefing(overview, now),
        tasks: buildTasks(overview, now),
        schedule: buildSchedule(overview, now),
        stations: buildStations(overview),
      },
    [overview, now],
  )

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// SEASON STATUS"
        title="Overview"
        titleClassName={dashboardTitleClasses}
        subtitle={overview ? seasonSubtitle(overview.recruitmentYear) : undefined}
      />
      {error ? (
        <p className={errorClasses} role="alert">
          {error}
        </p>
      ) : view === null ? (
        <p className={statusClasses} role="status">
          Loading the season…
        </p>
      ) : (
        <div className={layoutClasses}>
          <div className={mainColumnClasses}>
            <HrOverviewBriefing briefing={view.briefing} />
            <HrWorklist tasks={view.tasks} />
          </div>
          <div className={scheduleClasses}>
            <HrSeasonSchedule rows={view.schedule} />
          </div>
          <section className={seasonClasses} aria-labelledby="season-so-far-heading">
            <h3 id="season-so-far-heading" className={seasonHeadingClasses}>
              The season so far
            </h3>
            <div className="mt-3">
              <HrStageLine stations={view.stations} />
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
