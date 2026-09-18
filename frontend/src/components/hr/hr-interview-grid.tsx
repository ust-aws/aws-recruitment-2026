"use client"

import { HrInterviewGridView } from "@/components/hr/hr-interview-grid-view"
import { useHrInterviewGrid } from "@/components/hr/use-hr-interview-grid"
import type { InterviewSeasonBounds } from "@/lib/season/interview"

type HrInterviewGridProps = {
  seasonBounds: InterviewSeasonBounds
  seasonLoading: boolean
  seasonConfigured: boolean
}

export function HrInterviewGrid({
  seasonBounds,
  seasonLoading,
  seasonConfigured,
}: HrInterviewGridProps) {
  const grid = useHrInterviewGrid(seasonBounds, seasonConfigured)
  return (
    <HrInterviewGridView
      {...grid}
      seasonLoading={seasonLoading}
      seasonConfigured={seasonConfigured}
    />
  )
}
