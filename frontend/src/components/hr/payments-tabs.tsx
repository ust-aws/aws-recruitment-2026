"use client"

import type { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PaymentTab } from "@/lib/payments/workspace"

const rowClasses = "mt-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
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
      <Tabs value={tab} onValueChange={(next) => onTabChange(next as PaymentTab)}>
        <TabsList variant="line" aria-label="Payments view">
          <TabsTrigger value="review">
            To Review <span className={countClasses}>{reviewCount}</span>
          </TabsTrigger>
          <TabsTrigger value="all">
            All Payments <span className={countClasses}>{allCount}</span>
          </TabsTrigger>
          <TabsTrigger value="emails">
            Payment Emails <span className={countClasses}>{emailCount}</span>
          </TabsTrigger>
          <TabsTrigger value="late">
            Late Payments <span className={countClasses}>{lateCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {actions}
    </div>
  )
}
