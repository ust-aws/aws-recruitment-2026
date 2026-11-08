"use client"

import { SectionHeader } from "@/components/shared/section-header"
import { HrInterviewGrid } from "@/components/hr/interviews/hr-interview-grid"
import { HrInterviewWindow } from "@/components/hr/season/hr-interview-window"
import { HrRecruitmentWindow } from "@/components/hr/season/hr-recruitment-window"
import { HrSectionNav } from "@/components/hr/shell/hr-section-nav"
import { useInterviewWindow } from "@/hooks/use-interview-window"
import { hrPageShellClasses } from "@/lib/site/surface"

const stackClasses = "mt-4 flex flex-col gap-4"
const anchorClasses = "scroll-mt-24"

const sectionNavItems = [
  { id: "application-window", label: "Application Window" },
  { id: "interview-season", label: "Interview Season" },
  { id: "availability-grid", label: "Availability Grid" },
]

export function HrSeasonPage() {
  const {
    bounds: seasonBounds,
    loading: seasonLoading,
    configured: seasonConfigured,
    error: seasonLoadError,
    applyPayload,
  } = useInterviewWindow()

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// R101 SEASON"
        title="Recruitment Setup"
        subtitle="Manage application availability, interview dates, and interviewer schedules."
      />
      <HrSectionNav items={sectionNavItems} />
      <div className={stackClasses}>
        <div id="application-window" className={anchorClasses}>
          <HrRecruitmentWindow />
        </div>
        <div id="interview-season" className={anchorClasses}>
          <HrInterviewWindow
            key={`${seasonBounds?.startsAt.toISOString() ?? ""}:${seasonBounds?.endsAt.toISOString() ?? ""}`}
            seasonBounds={seasonBounds}
            seasonLoading={seasonLoading}
            loadError={seasonLoadError}
            onSaved={applyPayload}
          />
        </div>
        <div id="availability-grid" className={anchorClasses}>
          <HrInterviewGrid
            seasonBounds={seasonBounds}
            seasonLoading={seasonLoading}
            seasonConfigured={seasonConfigured}
          />
        </div>
      </div>
    </main>
  )
}
