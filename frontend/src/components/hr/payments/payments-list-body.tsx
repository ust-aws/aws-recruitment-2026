"use client"

import { PaymentsCaughtUp, PaymentsNoMatch, PaymentsNone } from "@/components/hr/payments/payments-empty"
import { PaymentsTable } from "@/components/hr/payments/payments-table"
import type { PaymentsView } from "@/components/hr/payments/use-payments-view"
import { Button } from "@/components/ui/button"
import type { PaymentCampaign } from "@/lib/api/payments"
import { EMPTY_PAYMENT_FILTERS } from "@/lib/payments/workspace"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const clearClasses = cn("mt-2 px-4", dashboardActionTargetClasses)

type PaymentsListBodyProps = {
  view: PaymentsView
  campaign: PaymentCampaign | null
  verified: number
  onSelect: (id: string) => void
}

/** The table, or the right empty state when there is nothing to show. */
export function PaymentsListBody({ view, campaign, verified, onSelect }: PaymentsListBodyProps) {
  if (view.payments.length === 0) return <PaymentsNone campaign={campaign} />

  if (view.visible.length === 0) {
    if (view.tab === "review") return <PaymentsCaughtUp verified={verified} />
    const clearFilters = (
      <Button type="button" color="purple" className={clearClasses} onClick={() => view.setFilters(EMPTY_PAYMENT_FILTERS)}>
        Clear Filters
      </Button>
    )
    return <PaymentsNoMatch action={clearFilters} />
  }

  return (
    <PaymentsTable
      payments={view.visible}
      selectedId={view.selectedId}
      onSelect={onSelect}
      label={view.tab === "review" ? "Receipts to review, oldest first" : "All payments"}
    />
  )
}
