"use client"

import { ApplyForm } from "@/components/apply/apply-form"
import { ApplySeasonClosed } from "@/components/apply/apply-season-closed"
import { useRecruitmentWindow } from "@/hooks/use-recruitment-window"
import { applyFlowShellClasses, glassPanelClasses } from "@/lib/site/surface"
import { SectionHeader } from "@/components/shared/section-header"

const loadingPanelClasses = `mx-auto w-full min-w-0 max-w-2xl ${glassPanelClasses} px-6 py-10 font-sans text-sm text-prelude md:px-10`

type ApplyFormGateProps = {
  initialPositionId?: string
}

export function ApplyFormGate({ initialPositionId }: ApplyFormGateProps) {
  const { window, loading, error, applicationsOpen } = useRecruitmentWindow()

  if (loading) {
    return (
      <main className={`${applyFlowShellClasses} gap-10`}>
        <SectionHeader
          eyebrow="// RECRUITMENT 101"
          title="Apply to AWS Builders – UST"
          titleClassName="max-w-none text-balance"
          subtitle="Every member lands on a committee that fits how they like to build, organize, or create."
        />
        <div className={loadingPanelClasses}>Loading application availability…</div>
      </main>
    )
  }

  if (error || !window || !applicationsOpen) {
    return (
      <ApplySeasonClosed
        window={
          window ?? {
            startsAt: null,
            endsAt: null,
            open: false,
            code: "not_configured",
            message: error || "Applications are not open right now.",
          }
        }
      />
    )
  }

  return <ApplyForm initialPositionId={initialPositionId} />
}
