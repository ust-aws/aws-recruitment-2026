"use client"

import { useMemo, useState } from "react"
import type { StripFilter } from "@/components/hr/payments/payments-status-strip"
import type { PaymentDashboard } from "@/lib/api/payments"
import {
  EMPTY_PAYMENT_FILTERS,
  defaultPaymentTab,
  filterPayments,
  reviewQueue,
  sortPayments,
  stepInList,
  type PaymentFilters,
  type PaymentTab,
} from "@/lib/payments/workspace"

/** Keeps `?tab=` in the address so a refresh or a shared link lands on the same view. */
function writeTabToUrl(tab: PaymentTab) {
  const url = new URL(window.location.href)
  url.searchParams.set("tab", tab)
  window.history.replaceState(window.history.state, "", url)
}

export function usePaymentsView(
  dashboard: PaymentDashboard | null,
  initialTab: PaymentTab | null,
  loading: boolean,
) {
  const [chosenTab, setChosenTab] = useState<PaymentTab | null>(initialTab)
  // Pick the opening tab once, when the data arrives; after that only the
  // officer changes it (verifying the last receipt must not jump tabs).
  if (chosenTab === null && !loading) {
    setChosenTab(defaultPaymentTab(dashboard?.summary ?? null))
  }
  const [filters, setFilters] = useState<PaymentFilters>(EMPTY_PAYMENT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const payments = useMemo(() => dashboard?.payments ?? [], [dashboard])
  const queue = useMemo(() => reviewQueue(payments), [payments])
  const filtered = useMemo(() => sortPayments(filterPayments(payments, filters)), [payments, filters])
  const tab = chosenTab ?? defaultPaymentTab(dashboard?.summary ?? null)
  const visible = tab === "review" ? queue : tab === "all" ? filtered : []
  const selected = payments.find((payment) => payment.paymentId === selectedId) ?? null
  const position = selected ? visible.findIndex((payment) => payment.paymentId === selected.paymentId) + 1 : 0

  function setTab(next: PaymentTab) {
    setChosenTab(next)
    setSelectedId(null)
    writeTabToUrl(next)
  }

  /** A count in the strip: the queue for pending receipts, else the full list filtered to it. */
  function pickStatus(filter: StripFilter) {
    if (filter === "pending_verification") {
      setTab("review")
      return
    }
    setTab("all")
    setFilters((current) => ({ ...current, status: filter }))
  }

  function step(delta: 1 | -1) {
    if (!selectedId) return
    const next = stepInList(visible, selectedId, delta)
    if (next) setSelectedId(next)
  }

  return {
    tab,
    setTab,
    filters,
    setFilters,
    payments,
    queue,
    visible,
    selected,
    selectedId,
    setSelectedId,
    position,
    stripActive: (tab === "review" ? "pending_verification" : filters.status) as StripFilter | null,
    canStep: (delta: 1 | -1) => Boolean(selectedId && position > 0 && visible[position - 1 + delta]),
    step,
    pickStatus,
  }
}

export type PaymentsView = ReturnType<typeof usePaymentsView>
