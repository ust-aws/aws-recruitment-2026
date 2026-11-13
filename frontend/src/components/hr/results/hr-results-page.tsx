"use client"

import { useEffect, useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { HrReleaseResultsDialog } from "@/components/hr/results/hr-release-results-dialog"
import { HrResultEmailStatus } from "@/components/hr/results/hr-result-email-status"
import { HrResultsList } from "@/components/hr/results/hr-results-list"
import { HrResultsSummary } from "@/components/hr/results/hr-results-summary"
import { SectionHeader } from "@/components/shared/section-header"
import {
  getResultsPreview,
  releaseResultsRequest,
  retryFailedResultEmailsRequest,
  type ResultsPreview,
} from "@/lib/api/client"
import { useRecruitmentTrack } from "@/lib/recruitment-track"
import { hrPageShellClasses } from "@/lib/site/surface"

const contentClasses = "mt-8 flex flex-col gap-8"
const listHeadingClasses = "font-sans text-xl font-bold text-blue-chalk"
const listSubtitleClasses = "mt-1 font-sans text-sm text-prelude"
const loadingClasses = "mt-8 font-sans text-sm text-prelude"

type Feedback = { type: "success" | "error"; message: string }

export function HrResultsPage() {
  const track = useRecruitmentTrack()
  const hunt = track === "officer_hunt"
  const [preview, setPreview] = useState<ResultsPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    "release" | "retry" | null
  >(null)
  // Bumped after a release or retry so the email progress panel reloads.
  const [emailStatusKey, setEmailStatusKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getResultsPreview(track)
      .then((payload) => {
        if (!cancelled) setPreview(payload)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load the results preview.",
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [track])

  async function refreshPreview() {
    setPreview(await getResultsPreview(track))
  }

  async function confirmRelease() {
    setPendingAction("release")
    setFeedback(null)
    let result
    try {
      result = await releaseResultsRequest(track)
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Could not release results.",
      })
      setPendingAction(null)
      return
    }

    setReleaseOpen(false)
    let message = `Released ${result.released} results${result.seated ? `, ${result.seated} seated as officers` : ""}. ${result.emailDelivery.queued} emails are being sent in the background; progress is shown below.`
    setEmailStatusKey((key) => key + 1)
    try {
      await refreshPreview()
    } catch {
      message += " Refresh the page to update the preview."
    }
    setFeedback({ type: "success", message })
    setPendingAction(null)
  }

  async function retryEmails() {
    setPendingAction("retry")
    setFeedback(null)
    try {
      const result = await retryFailedResultEmailsRequest(track)
      setFeedback({
        type: "success",
        message:
          result.retried === 0
            ? "There were no failed result emails to retry."
            : `Queued ${result.retried} failed emails to send again in the background.`,
      })
      setEmailStatusKey((key) => key + 1)
    } catch (error: unknown) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not retry failed result emails.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow={hunt ? "// OFFICER HUNT" : "// RESULTS"}
        title={hunt ? "Release Officer Hunt Results" : "Release Results"}
        subtitle={
          hunt
            ? "Review the hunt's batch and resolve incomplete decisions. Releasing seats the winners as officers and emails everyone."
            : "Review the current recruitment batch, resolve incomplete decisions, and publish final outcomes."
        }
      />
      {feedback ? (
        <ActionFeedback type={feedback.type} message={feedback.message} />
      ) : null}
      {loading ? (
        <p className={loadingClasses}>Loading results preview…</p>
      ) : preview ? (
        <div className={contentClasses}>
          <HrResultsSummary
            summary={preview.summary}
            pendingAction={pendingAction}
            onRelease={() => setReleaseOpen(true)}
            onRetry={() => void retryEmails()}
          />
          <HrResultEmailStatus refreshKey={emailStatusKey} />
          <section>
            <h3 className={listHeadingClasses}>Release preview</h3>
            <p className={listSubtitleClasses}>
              {hunt ? "Term" : "Recruitment"} year {preview.recruitmentYear}. Open incomplete
              applications to finish their committee decisions or placement.
            </p>
            <div className="mt-4">
              <HrResultsList applications={preview.applications} />
            </div>
          </section>
        </div>
      ) : null}
      {preview ? (
        <HrReleaseResultsDialog
          open={releaseOpen}
          summary={preview.summary}
          pending={pendingAction === "release"}
          onOpenChange={setReleaseOpen}
          onConfirm={() => void confirmRelease()}
        />
      ) : null}
    </main>
  )
}
