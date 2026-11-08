"use client"

import type { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PaymentTab } from "@/lib/payments/workspace"

const rowClasses = "mt-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
// Phones get one-word labels so all four tabs fit; screen readers still hear the full name.
const listClasses = "max-sm:gap-4"
const longOnlyClasses = "max-sm:sr-only"
const countClasses = "rounded-pill bg-blue-chalk/10 px-2 py-0.5 font-sans text-xs tabular-nums text-prelude"

type PaymentsTabsProps = {
  tab: PaymentTab
  onTabChange: (tab: PaymentTab) => void
  reviewCount: number
  allCount: number
  /** People still to be sent the payment email. */
  emailCount: number
  /** People who still owe a payment. */
  lateCount: number
  actions: ReactNode
}

export function PaymentsTabs({ tab, onTabChange, reviewCount, allCount, emailCount, lateCount, actions }: PaymentsTabsProps) {
  return (
    <div className={rowClasses}>
      <Tabs value={tab} onValueChange={(next) => onTabChange(next as PaymentTab)} className="min-w-0">
        <TabsList variant="line" aria-label="Payments view" className={listClasses}>
          <TabsTrigger value="review">
            <span><span className={longOnlyClasses}>To </span>Review</span> <span className={countClasses}>{reviewCount}</span>
          </TabsTrigger>
          <TabsTrigger value="all">
            <span>All<span className={longOnlyClasses}> Payments</span></span> <span className={countClasses}>{allCount}</span>
          </TabsTrigger>
          <TabsTrigger value="emails">
            <span><span className={longOnlyClasses}>Payment </span>Emails</span> <span className={countClasses}>{emailCount}</span>
          </TabsTrigger>
          <TabsTrigger value="late">
            <span>Late<span className={longOnlyClasses}> Payments</span></span> <span className={countClasses}>{lateCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {actions}
    </div>
  )
}
