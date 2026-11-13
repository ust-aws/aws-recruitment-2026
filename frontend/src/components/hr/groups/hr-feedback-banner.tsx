"use client"

import { useEffect, useRef } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"

const bannerClasses = "mb-4 mt-0"
const SUCCESS_DISMISS_MS = 6000

type Feedback = { type: "success" | "error"; message: string }

/** Save confirmation shown next to the form it belongs to; successes clear on their own. */
export function HrFeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: Feedback | null
  onDismiss: () => void
}) {
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  })

  useEffect(() => {
    if (feedback?.type !== "success") return
    const timer = window.setTimeout(() => dismissRef.current(), SUCCESS_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [feedback])

  if (!feedback) return null
  return (
    <ActionFeedback
      type={feedback.type}
      message={feedback.message}
      className={bannerClasses}
    />
  )
}
