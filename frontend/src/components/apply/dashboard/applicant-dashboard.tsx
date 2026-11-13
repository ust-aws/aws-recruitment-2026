"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApplicantDashboardContent } from "@/components/apply/dashboard/applicant-dashboard-content"
import {
  ApplicantDashboardHeaderSkeleton,
  ApplicantDashboardSkeleton,
} from "@/components/apply/dashboard/applicant-dashboard-skeleton"
import type { InitialApplicantPayment } from "@/components/apply/payment/use-applicant-payment"
import { SectionHeader } from "@/components/shared/section-header"
import { ApiError } from "@/lib/api/client"
import {
  getApplicantApplication,
  updateApplicantChoices,
  type ApplicantApplication,
} from "@/lib/api/applicant"
import { applicantDashboardState } from "@/lib/apply/dashboard-state"
import { dashboardPanelClasses, dashboardTitleClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Header, then one column of solid sections in a fixed order.
const stackClasses = "flex min-w-0 flex-col gap-4"
const missingClasses = cn(dashboardPanelClasses, "px-5 py-5 font-sans text-sm text-blue-chalk sm:px-6")
const EYEBROW = "// APPLICANT DASHBOARD"

type ApplicantDashboardProps = {
  initialApplication?: ApplicantApplication | null
  initialPayment?: InitialApplicantPayment
}

export function ApplicantDashboard({ initialApplication = null, initialPayment = null }: ApplicantDashboardProps) {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicantApplication | null>(initialApplication)
  const [loading, setLoading] = useState(initialApplication === null)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [pending, setPending] = useState(false)
  const [previewPositionId, setPreviewPositionId] = useState<string>()
  const [previewSlotId, setPreviewSlotId] = useState("")

  useEffect(() => {
    let cancelled = false
    getApplicantApplication()
      .then((payload) => {
        if (cancelled) return
        setApplication(payload)
        setError("")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          setError("Your session expired. Open the application status page to sign in again.")
          return
        }
        setError(err instanceof Error ? err.message : "Could not load your application.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSave(input: Parameters<typeof updateApplicantChoices>[0]) {
    setSaveError("")
    setSaveSuccess("")
    setPending(true)
    try {
      setApplication(await updateApplicantChoices(input))
      setPreviewPositionId(undefined)
      setPreviewSlotId("")
      setSaveSuccess("Committee choices saved.")
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/apply/status")
        return
      }
      setSaveError(err instanceof Error ? err.message : "Could not update committee choices.")
    } finally {
      setPending(false)
    }
  }

  const handlePreviewPositionIdChange = useCallback((positionId: string | undefined) => {
    setPreviewPositionId(positionId)
    setPreviewSlotId("")
  }, [])

  if (loading) {
    return (
      <>
        <ApplicantDashboardHeaderSkeleton />
        <ApplicantDashboardSkeleton />
      </>
    )
  }

  if (error || !application) {
    return (
      <>
        <SectionHeader eyebrow={EYEBROW} title="Your application" titleClassName={dashboardTitleClasses} level="h1" />
        <p className={missingClasses} role="alert">
          {error || "Application not found."}
        </p>
      </>
    )
  }

  const state = applicantDashboardState(application)

  return (
    <>
      <SectionHeader
        eyebrow={EYEBROW}
        title={state.title}
        subtitle={state.subtitle}
        titleClassName={dashboardTitleClasses}
        level="h1"
      />
      <div className={stackClasses}>
        <ApplicantDashboardContent
          application={application}
          state={state}
          initialPayment={initialPayment}
          pending={pending}
          saveError={saveError}
          saveSuccess={saveSuccess}
          previewPositionId={previewPositionId}
          previewSlotId={previewSlotId}
          onPreviewSlotIdChange={setPreviewSlotId}
          onPreviewPositionIdChange={handlePreviewPositionIdChange}
          onSave={onSave}
          onApplicationUpdated={setApplication}
        />
      </div>
    </>
  )
}
