"use client"

import { useState } from "react"
import { PaymentsFilters } from "@/components/hr/payments/payments-filters"
import { PaymentsListBody } from "@/components/hr/payments/payments-list-body"
import { decisionMessage, type EmailDelivery } from "@/components/hr/payments/review/payments-review-messages"
import { PaymentsReviewDock } from "@/components/hr/payments/review/payments-review-dock"
import { PaymentsReviewPanel } from "@/components/hr/payments/review/payments-review-panel"
import type { ReviewDecision } from "@/components/hr/payments/review/use-payment-review"
import type { HrPaymentFeedback } from "@/components/hr/payments/use-hr-payment-workspace"
import type { PaymentsView } from "@/components/hr/payments/use-payments-view"
import { useReviewKeyboard } from "@/components/hr/payments/review/use-review-keyboard"
import type { PaymentCampaign } from "@/lib/api/payments"
import { fullName, nextAfterDecision } from "@/lib/payments/workspace"
import { cn } from "@/lib/utils"

// The table, with the review panel docked beside it while a row is open.
const areaClasses = "mt-4 grid items-start gap-4"
const dockedClasses = "xl:grid-cols-[minmax(0,1fr)_26rem]"

type PaymentsListAreaProps = {
  view: PaymentsView
  campaign: PaymentCampaign | null
  verified: number
  refresh: () => Promise<void>
  onFeedback: (feedback: HrPaymentFeedback) => void
}

export function PaymentsListArea({ view, campaign, verified, refresh, onFeedback }: PaymentsListAreaProps) {
  const { selected, step, setSelectedId } = view
  const [notice, setNotice] = useState<HrPaymentFeedback | null>(null)

  function close() {
    const id = view.selectedId
    setSelectedId(null)
    setNotice(null)
    // Back to the row the officer opened, so the keyboard picks up where it was.
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-payment-id="${id}"]`)?.focus())
  }

  function select(id: string) {
    setNotice(null)
    setSelectedId(id)
  }

  function move(direction: 1 | -1) {
    setNotice(null)
    step(direction)
  }

  useReviewKeyboard({ open: Boolean(selected), step, close, onMove: () => setNotice(null) })

  async function onDecided(decision: ReviewDecision, delivery: EmailDelivery) {
    if (!selected) return
    const nextId = view.tab === "review" ? nextAfterDecision(view.queue, selected.paymentId) : selected.paymentId
    const message = decisionMessage(decision, fullName(selected), delivery, view.tab === "review" && nextId === null)
    await refresh()
    setSelectedId(nextId)
    // Said once: in the panel while it stays open, on the page when it closes.
    if (nextId) setNotice(message)
    else onFeedback(message)
  }

  return (
    <>
      {view.tab === "all" ? <PaymentsFilters payments={view.payments} filters={view.filters} onFiltersChange={view.setFilters} /> : null}
      <div className={cn(areaClasses, selected && dockedClasses)}>
        <PaymentsListBody view={view} campaign={campaign} verified={verified} onSelect={select} />
        <PaymentsReviewDock open={Boolean(selected)} title={selected ? fullName(selected) : ""} onClose={close}>
          {selected ? (
            <PaymentsReviewPanel
              key={`${selected.paymentId}:${selected.status}`}
              payment={selected}
              position={view.position}
              total={view.visible.length}
              onPrevious={view.canStep(-1) ? () => move(-1) : null}
              onNext={view.canStep(1) ? () => move(1) : null}
              onClose={close}
              notice={notice}
              onDecided={onDecided}
            />
          ) : null}
        </PaymentsReviewDock>
      </div>
    </>
  )
}
