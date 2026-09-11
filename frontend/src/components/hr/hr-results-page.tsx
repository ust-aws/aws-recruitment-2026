"use client"

import { useEffect, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { HrReleaseResultsDialog } from "@/components/hr/hr-release-results-dialog"
import { HrResultsList } from "@/components/hr/hr-results-list"
import { HrResultsSummary } from "@/components/hr/hr-results-summary"
import { SectionHeader } from "@/components/section-header"
import {
  getResultsPreview,
  releaseResultsRequest,
  retryFailedResultEmailsRequest,
  type ResultsPreview,
} from "@/lib/api-client"
import { pageShellClasses } from "@/lib/surface"

const contentClasses = "mt-8 flex flex-col gap-8"
const listHeadingClasses = "font-sans text-xl font-bold text-blue-chalk"
const listSubtitleClasses = "mt-1 font-sans text-sm text-prelude"
const loadingClasses = "mt-8 font-sans text-sm text-prelude"

type Feedback = { type: "success" | "error"; message: string }

export function HrResultsPage() {
  const [preview, setPreview] = useState<ResultsPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    "release" | "retry" | null
  >(null)

  useEffect(() => {
    let cancelled = false
    getResultsPreview()
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
  }, [])

  async function refreshPreview() {
    setPreview(await getResultsPreview())
  }

  async function confirmRelease() {
    setPendingAction("release")
    setFeedback(null)
    let result
    try {
      result = await releaseResultsRequest()
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
    let message = `Released ${result.released} results. ${result.emailDelivery.sent} emails sent${result.emailDelivery.failed > 0 ? `; ${result.emailDelivery.failed} failed and can be retried.` : "."}`
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
      const result = await retryFailedResultEmailsRequest()
      setFeedback({
        type: "success",
        message:
          result.retried === 0
            ? "There were no failed result emails to retry."
            : `Retried ${result.retried} emails. ${result.sent} sent${result.failed > 0 ? `; ${result.failed} still failed.` : "."}`,
      })
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
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// RESULTS"
        title="Release Results"
        subtitle="Preview the current recruitment batch before publishing final results to applicants."
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
          <section>
            <h3 className={listHeadingClasses}>Release preview</h3>
            <p className={listSubtitleClasses}>
              Recruitment year {preview.recruitmentYear}. Open incomplete
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
