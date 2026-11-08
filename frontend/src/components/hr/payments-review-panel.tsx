"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { PaymentStatusPill } from "@/components/hr/payment-status-pill"
import { PaymentsReviewDecision } from "@/components/hr/payments-review-decision"
import { PaymentsReviewSubmissions } from "@/components/hr/payments-review-submissions"
import { usePaymentReview, type ReviewDecision } from "@/components/hr/use-payment-review"
import type { PaymentListItem } from "@/lib/api/payments"
import { formatDisplayDateTime } from "@/lib/datetime/display"
import { fullName, paymentDueAt, paysAsLabel } from "@/lib/payments/workspace"
import { cn } from "@/lib/utils"

const panelClasses = "flex h-full min-h-0 flex-col"
const headClasses = "flex items-start justify-between gap-3 border-b border-blue-chalk/10 px-5 pb-4 pt-5"
const nameClasses = "font-sans text-lg font-bold text-balance text-blue-chalk outline-none"
const codeClasses = "mt-0.5 font-mono text-xs tabular-nums text-prelude"
const iconButtonClasses =
  "grid size-9 shrink-0 place-items-center rounded-md text-prelude outline-none transition-colors hover:bg-blue-chalk/10 hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/50 disabled:pointer-events-none disabled:opacity-40 pointer-coarse:size-11"
const bodyClasses = "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5"
const factsClasses = "grid grid-cols-2 gap-x-4 gap-y-3"
const factLabelClasses = "font-sans text-xs text-prelude"
const factValueClasses = "mt-0.5 break-words font-sans text-sm text-blue-chalk"
const footClasses = "flex flex-col gap-4 border-t border-blue-chalk/10 px-5 py-4"
const navClasses = "flex items-center justify-between gap-2"
const positionClasses = "font-sans text-xs tabular-nums text-prelude"
const errorClasses = "font-sans text-sm text-rose-glow"
const loadingClasses = "font-sans text-sm text-prelude"
const keysClasses = "hidden font-sans text-xs text-prelude lg:inline"
const noticeClasses = "font-sans text-sm text-blue-chalk"
const noticeErrorClasses = "font-sans text-sm text-rose-glow"

function Fact({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className={factLabelClasses}>{label}</dt>
      <dd className={factValueClasses}>{children}</dd>
    </div>
  )
}

type PaymentsReviewPanelProps = {
  payment: PaymentListItem
  /** 1-based place in the list being worked through; 0 when filtered out of it. */
  position: number
  total: number
  onPrevious: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
  /** The last decision's outcome, shown here so it is seen even in the sheet. */
  notice: { type: "success" | "error"; message: string } | null
  onDecided: (decision: ReviewDecision, emailDelivery: { sent: number; failed: number; queued?: number } | null) => Promise<void>
}

export function PaymentsReviewPanel({ payment, position, total, onPrevious, onNext, onClose, notice, onDecided }: PaymentsReviewPanelProps) {
  const review = usePaymentReview(payment.paymentId, onDecided)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Each receipt the panel lands on takes focus, so keyboard and screen
  // reader users follow it after Verify or Next.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  const deadline = paymentDueAt(payment)

  return (
    <div className={panelClasses} data-review-panel>
      <div className={headClasses}>
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className={nameClasses}>
            {fullName(payment)}
          </h2>
          <p className={codeClasses}>{payment.applicationCode}</p>
          <div className="mt-2">
            <PaymentStatusPill status={payment.status} />
          </div>
        </div>
        <button type="button" className={iconButtonClasses} onClick={onClose} aria-label="Close review panel">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className={bodyClasses}>
        <dl className={factsClasses}>
          {payment.applicationType === "officer" ? null : (
            <Fact label="Result">{payment.applicationStatus === "approved" ? "Accepted" : "Not selected"}</Fact>
          )}
          <Fact label="Pays as">{paysAsLabel(payment)}</Fact>
          <Fact label="Placement" wide>
            {[payment.committee, payment.finalPosition].filter(Boolean).join(" · ") || "—"}
          </Fact>
          <Fact label={payment.status === "needs_resubmission" ? "Resubmit by" : "Pay by"}>
            {formatDisplayDateTime(new Date(deadline), { dateStyle: "medium", timeStyle: "short" })}
          </Fact>
          <Fact label="Member ID">{payment.memberId ?? "Not yet"}</Fact>
          <Fact label="Email" wide>
            <span className="break-all">{payment.email}</span>
          </Fact>
        </dl>
        {review.details ? (
          <PaymentsReviewSubmissions submissions={review.details.submissions} onReceipt={(id) => void review.openReceipt(id)} />
        ) : review.error ? null : (
          <p className={loadingClasses} role="status">Loading the receipt…</p>
        )}
      </div>
      <div className={footClasses}>
        {notice ? (
          <p className={notice.type === "error" ? noticeErrorClasses : noticeClasses} role="status" aria-live="polite">
            {notice.message}
          </p>
        ) : null}
        {review.error ? <p className={errorClasses} role="alert">{review.error}</p> : null}
        <PaymentsReviewDecision review={review} />
        <div className={navClasses}>
          <button type="button" className={iconButtonClasses} disabled={!onPrevious} onClick={() => onPrevious?.()} aria-label="Previous payment">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className={positionClasses}>
            {position > 0 ? `${position} of ${total}` : "Not in the current list"}{" "}
            <span className={keysClasses}>· ↑ ↓ to move, Esc to close</span>
          </span>
          <button type="button" className={iconButtonClasses} disabled={!onNext} onClick={() => onNext?.()} aria-label="Next payment">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
