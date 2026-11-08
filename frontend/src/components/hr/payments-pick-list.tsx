"use client"

import { useState, type ReactNode } from "react"
import { PaymentStatusPill } from "@/components/hr/payment-status-pill"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { PaymentListItem } from "@/lib/api/payments"
import { EMPTY_PAYMENT_FILTERS, filterPayments, fullName } from "@/lib/payments/workspace"
import { dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const searchClasses = cn(fieldControlClasses, "mt-4 border border-blue-chalk/20")
const noteClasses = "mt-4 font-sans text-sm leading-relaxed text-prelude"
const selectAllClasses = cn("mt-4 flex cursor-pointer items-center gap-3 px-1 font-sans text-sm text-blue-chalk", dashboardRowTargetClasses)
const listClasses = "mt-2 flex max-h-[28rem] flex-col gap-2 overflow-y-auto"
const rowClasses = cn("flex cursor-pointer items-center gap-3 rounded-[12px] bg-haiti/55 px-3 py-2", dashboardRowTargetClasses)
const whoClasses = "min-w-0 flex-1"
const nameClasses = "block truncate font-sans text-sm text-blue-chalk"
const detailClasses = "block truncate font-mono text-xs text-prelude"
const asideClasses = "hidden shrink-0 font-sans text-xs text-prelude sm:block"

type PaymentsPickListProps = {
  rows: PaymentListItem[]
  picked: ReadonlySet<string>
  onPickedChange: (picked: ReadonlySet<string>) => void
  /** Shown when there is no one to list at all. */
  empty: string
  /** A short note beside each person, from sm up. */
  aside?: (payment: PaymentListItem) => ReactNode
}

/** Searchable tick list of people. Ticks survive a new search. */
export function PaymentsPickList({ rows, picked, onPickedChange, empty, aside }: PaymentsPickListProps) {
  const [query, setQuery] = useState("")
  const shown = filterPayments(rows, { ...EMPTY_PAYMENT_FILTERS, query })
  const shownPicked = shown.filter((payment) => picked.has(payment.paymentId)).length
  const allShownPicked = shown.length > 0 && shownPicked === shown.length

  function pick(ids: string[], on: boolean) {
    const next = new Set(picked)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    onPickedChange(next)
  }

  if (rows.length === 0) return <p className={noteClasses}>{empty}</p>
  return (
    <>
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name, code or email"
        aria-label="Search this list"
        className={searchClasses}
      />
      {shown.length === 0 ? (
        <p className={noteClasses}>No one here matches that search.</p>
      ) : (
        <>
          <label className={selectAllClasses}>
            <Checkbox
              checked={allShownPicked}
              indeterminate={shownPicked > 0 && !allShownPicked}
              onCheckedChange={(on) => pick(shown.map((payment) => payment.paymentId), on)}
            />
            {query.trim() ? `Select all matches (${shown.length})` : `Select all (${shown.length})`}
          </label>
          <ul className={listClasses}>
            {shown.map((payment) => (
              <li key={payment.paymentId}>
                <label className={rowClasses}>
                  <Checkbox checked={picked.has(payment.paymentId)} onCheckedChange={(on) => pick([payment.paymentId], on)} />
                  <span className={whoClasses}>
                    <span className={nameClasses}>{fullName(payment)}</span>
                    <span className={detailClasses}>{payment.applicationCode} · {payment.email}</span>
                  </span>
                  {aside?.(payment) ? <span className={asideClasses}>{aside(payment)}</span> : null}
                  <PaymentStatusPill status={payment.status} />
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
