"use client"

import { useEffect, useState } from "react"
import { ApplyForm } from "@/components/apply/form/apply-form"
import { ApplySeasonClosed } from "@/components/apply/form/apply-season-closed"
import { SectionHeader } from "@/components/shared/section-header"
import { getOfficerHuntStatus } from "@/lib/api/officer-hunt"
import type { RecruitmentWindow } from "@/lib/api/client"
import { RecruitmentTrackProvider } from "@/lib/recruitment-track"
import { applyFlowShellClasses, glassPanelClasses } from "@/lib/site/surface"

const loadingPanelClasses = `mx-auto w-full min-w-0 max-w-2xl ${glassPanelClasses} px-6 py-10 font-sans text-sm text-prelude md:px-10`

const unavailable = (message: string): RecruitmentWindow => ({
  startsAt: null,
  endsAt: null,
  open: false,
  code: "not_configured",
  message,
})

/** The officer hunt's apply page: the same form as R101, once HR has opened the hunt. */
export function OfficerHuntGate() {
  const [season, setSeason] = useState<RecruitmentWindow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getOfficerHuntStatus()
      .then((status) => {
        if (!cancelled) setSeason(status.season)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSeason(unavailable(error instanceof Error ? error.message : "Could not load the officer hunt schedule."))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <main className={`${applyFlowShellClasses} gap-10`}>
        <SectionHeader
          eyebrow="// OFFICER HUNT"
          title="Run for AWS Builders – UST Officer"
          titleClassName="max-w-none text-balance"
          subtitle="Lead the next term as a board member, director or executive assistant."
        />
        <div className={loadingPanelClasses}>Loading officer hunt availability…</div>
      </main>
    )
  }

  if (!season?.open) {
    return (
      <RecruitmentTrackProvider track="officer_hunt">
        <ApplySeasonClosed window={season ?? unavailable("The officer hunt is not open right now.")} />
      </RecruitmentTrackProvider>
    )
  }

  return <ApplyForm track="officer_hunt" />
}
