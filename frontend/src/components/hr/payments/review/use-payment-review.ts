"use client"

import { useEffect, useState } from "react"
import {
  getPaymentDetails,
  getPaymentReceiptUrl,
  rejectPayment,
  reversePayment,
  verifyPayment,
  type PaymentDetails,
} from "@/lib/api/payments"

export type ReviewDecision = "verified" | "rejected" | "reversed"
/** Reject and Reverse need a reason before they can be confirmed. */
export type ReviewForm = "reject" | "reverse" | null

type EmailDelivery = { sent: number; failed: number; queued?: number }

/**
 * One receipt under review: its details, and the verify / reject / reverse
 * calls. `onDecided` runs after the server accepts a decision.
 */
export function usePaymentReview(
  paymentId: string,
  onDecided: (decision: ReviewDecision, emailDelivery: EmailDelivery | null) => Promise<void>,
) {
  const [details, setDetails] = useState<PaymentDetails | null>(null)
  const [form, setForm] = useState<ReviewForm>(null)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    getPaymentDetails(paymentId)
      .then((payment) => {
        if (active) setDetails(payment)
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load this payment.")
      })
    return () => {
      active = false
    }
  }, [paymentId])

  async function run(decision: ReviewDecision, operation: () => Promise<unknown>) {
    setPending(true)
    setError("")
    let result: { emailDelivery?: EmailDelivery } | undefined
    try {
      result = (await operation()) as typeof result
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this decision. Try again.")
      setPending(false)
      return
    }
    // Saved. A failed list refresh after this is not a failed decision.
    try {
      await onDecided(decision, result?.emailDelivery ?? null)
    } catch {
      setError("Saved, but the list could not refresh. Reload the page to see the latest.")
      setPending(false)
    }
    // On success the panel remounts (next receipt, or this one with its new
    // status), so there is nothing to reset here.
  }

  // They resubmit by the payment period's deadline, which is set in Payment Setup, not here.
  const resubmission = () => ({ reason: reason.trim() })

  return {
    details,
    form,
    setForm,
    reason,
    setReason,
    pending,
    error,
    verify: () => run("verified", () => verifyPayment(paymentId)),
    reject: () => run("rejected", () => rejectPayment(paymentId, resubmission())),
    reverseVerification: () => run("reversed", () => reversePayment(paymentId, resubmission())),
    async openReceipt(submissionId: string) {
      // Open the tab first so the browser does not treat it as a pop-up.
      const tab = window.open("", "_blank")
      try {
        const { url } = await getPaymentReceiptUrl(paymentId, submissionId)
        if (tab) {
          tab.opener = null
          tab.location.href = url
        } else {
          window.open(url, "_blank", "noopener,noreferrer")
        }
      } catch (caught) {
        tab?.close()
        setError(caught instanceof Error ? caught.message : "Could not open the receipt.")
      }
    },
  }
}

export type PaymentReviewState = ReturnType<typeof usePaymentReview>
