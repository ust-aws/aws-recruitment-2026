"use client"

import { SectionHeader } from "@/components/section-header"
import { HrInterviewGrid } from "@/components/hr/hr-interview-grid"
import { HrInterviewWindow } from "@/components/hr/hr-interview-window"
import { HrRecruitmentWindow } from "@/components/hr/hr-recruitment-window"
import { useInterviewWindow } from "@/hooks/use-interview-window"
import { pageShellClasses } from "@/lib/surface"

const stackClasses = "mt-8 flex flex-col gap-4"

export function HrSeasonPage() {
  const {
    bounds: seasonBounds,
    loading: seasonLoading,
    configured: seasonConfigured,
    error: seasonLoadError,
    applyPayload,
  } = useInterviewWindow()

  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// SEASON"
        title="Recruitment Week & Interviews"
        subtitle="Set the application window and manage interview slot availability."
      />
      <div className={stackClasses}>
        <HrRecruitmentWindow />
        <HrInterviewWindow
          seasonBounds={seasonBounds}
          seasonLoading={seasonLoading}
          loadError={seasonLoadError}
          onSaved={applyPayload}
        />
        <HrInterviewGrid
          seasonBounds={seasonBounds}
          seasonLoading={seasonLoading}
          seasonConfigured={seasonConfigured}
        />
      </div>
    </main>
  )
}
