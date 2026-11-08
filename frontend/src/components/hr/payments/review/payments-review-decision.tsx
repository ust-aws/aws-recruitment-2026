"use client"

import { PaymentsReviewReasonForm } from "@/components/hr/payments/review/payments-review-reason-form"
import type { PaymentReviewState } from "@/components/hr/payments/review/use-payment-review"
import { Button } from "@/components/ui/button"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// The decision sits at the foot of the panel. Verify is the one aquamarine
// action; reject and reverse need a reason and a new deadline first.
const rowClasses = "flex flex-wrap gap-2"
const buttonClasses = cn("px-4", dashboardActionTargetClasses)
const hintClasses = "font-sans text-xs text-prelude"

export function PaymentsReviewDecision({ review }: { review: PaymentReviewState }) {
  const { details, form, pending } = review
  if (!details) return null
  if (form) return <PaymentsReviewReasonForm review={review} mode={form} />

  if (details.status === "pending_verification") {
    return (
      <div className={rowClasses}>
        <Button type="button" color="cyan" className={buttonClasses} disabled={pending} onClick={() => void review.verify()}>
          {pending ? "Verifying…" : "Verify Payment"}
        </Button>
        <Button type="button" color="purple" className={buttonClasses} disabled={pending} onClick={() => review.setForm("reject")}>
          Reject Receipt
        </Button>
      </div>
    )
  }

  if (details.status === "verified") {
    return (
      <Button type="button" color="danger" className={buttonClasses} disabled={pending} onClick={() => review.setForm("reverse")}>
        Reverse Verification
      </Button>
    )
  }

  return <p className={hintClasses}>Nothing to decide until a receipt is submitted.</p>
}
