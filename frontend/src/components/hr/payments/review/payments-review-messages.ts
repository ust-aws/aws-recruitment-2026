import type { ReviewDecision } from "@/components/hr/payments/review/use-payment-review"
import type { HrPaymentFeedback } from "@/components/hr/payments/use-hr-payment-workspace"

export type EmailDelivery = { sent: number; failed: number; queued?: number } | null

/** What the officer is told after a decision. `lastOne` adds that the review queue is now empty. */
export function decisionMessage(
  decision: ReviewDecision,
  name: string,
  delivery: EmailDelivery,
  lastOne: boolean,
): HrPaymentFeedback {
  const tail = lastOne ? " That was the last receipt. All caught up." : ""
  if (decision === "verified" && delivery && delivery.failed > 0) {
    return { type: "error", message: `Verified ${name}, but their Member ID email could not be sent. Use Retry Emails later.${tail}` }
  }
  if (decision === "verified") {
    return { type: "success", message: `Verified ${name}. Their Member ID email ${delivery?.queued ? "is on its way" : "was sent"}.${tail}` }
  }
  const emailed = delivery && delivery.failed > 0
    ? "Their email could not be sent, so tell them to check their dashboard."
    : delivery?.queued
      ? "They are being emailed what to fix."
      : "They were emailed what to fix."
  const type = delivery && delivery.failed > 0 ? "error" : "success"
  if (decision === "rejected") return { type, message: `Rejected ${name}'s receipt. ${emailed} They can resubmit from their dashboard.${tail}` }
  return { type, message: `Reversed ${name}'s verification. ${emailed}${tail}` }
}
