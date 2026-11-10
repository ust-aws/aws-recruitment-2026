"use client"

import type { PaymentReviewState } from "@/components/hr/payments/review/use-payment-review"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const rowClasses = "flex flex-wrap gap-2"
const buttonClasses = cn("px-4", dashboardActionTargetClasses)
const formClasses = "flex flex-col gap-3"
const fieldClasses = "flex flex-col gap-1.5"
const hintClasses = "font-sans text-xs text-prelude"

type ReasonFormProps = {
  review: PaymentReviewState
  /** Reject sends the applicant back to resubmit; reverse undoes a verification. */
  mode: "reject" | "reverse"
}

/** Reject and reverse both need a reason the applicant will read. */
export function PaymentsReviewReasonForm({ review, mode }: ReasonFormProps) {
  const reversing = mode === "reverse"
  const confirmLabel = reversing ? "Confirm Reversal" : "Confirm Rejection"

  return (
    <div className={formClasses} data-review-form>
      <div className={fieldClasses}>
        <Label htmlFor="payment-review-reason">{reversing ? "Why reverse it?" : "What is wrong with the receipt?"}</Label>
        <Textarea
          id="payment-review-reason"
          value={review.reason}
          onChange={(event) => review.setReason(event.target.value)}
          placeholder={reversing ? "e.g. The transfer was refunded" : "e.g. The reference does not match GCash"}
        />
        <p className={hintClasses}>
          The applicant sees this note on their dashboard and in an email, and can resubmit until the payment
          deadline.{reversing ? " After the deadline you can still reverse; no email is sent then." : ""}
        </p>
      </div>
      <div className={rowClasses}>
        <Button type="button" color="purple" className={buttonClasses} disabled={review.pending} onClick={() => review.setForm(null)}>
          Cancel
        </Button>
        <Button
          type="button"
          color="danger"
          className={buttonClasses}
          disabled={review.pending || !review.reason.trim()}
          onClick={() => void (reversing ? review.reverseVerification() : review.reject())}
        >
          {review.pending ? "Saving…" : confirmLabel}
        </Button>
      </div>
    </div>
  )
}
