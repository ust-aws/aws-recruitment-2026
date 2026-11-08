import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import {
  paymentEmailCounts,
  type PaymentEmailFilter,
} from "@/lib/payments/workspace"
import type { PaymentListItem } from "@/lib/api/payments"
import { cn } from "@/lib/utils"

// A second, quieter row under the status counts: has everyone been told to pay?
// Each count filters the list to those people; picking it again clears it.
const stripClasses = cn(
  dashboardPanelClasses,
  "mt-3 grid grid-cols-[auto_1fr] items-stretch overflow-hidden sm:grid-cols-[auto_repeat(3,minmax(0,1fr))]",
)
const titleClasses =
  "col-span-2 flex items-center border-b border-blue-chalk/10 px-4 py-2 font-sans text-xs font-medium text-prelude sm:col-span-1 sm:border-b-0 sm:border-r sm:py-3"
const cellClasses =
  "group col-span-2 flex min-w-0 items-baseline justify-between gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-blue-chalk/5 focus-visible:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aquamarine/50 pointer-coarse:min-h-12 sm:col-span-1 sm:flex-col sm:items-start sm:gap-1 sm:border-l sm:border-blue-chalk/10 sm:first-of-type:border-l-0"
const activeCellClasses = "bg-blue-chalk/8 shadow-[inset_0_-2px_0_var(--biloba-flower)]"
const labelClasses = "font-sans text-xs text-prelude"
const valueClasses = "font-sans text-xl font-bold tabular-nums leading-none text-blue-chalk"

type Cell = { filter: Exclude<PaymentEmailFilter, "all">; label: string; value: number }

type PaymentsEmailStripProps = {
  payments: PaymentListItem[]
  /** The email filter currently applied to the list. */
  active: PaymentEmailFilter
  onPick: (filter: Exclude<PaymentEmailFilter, "all">) => void
}

export function PaymentsEmailStrip({ payments, active, onPick }: PaymentsEmailStripProps) {
  const counts = paymentEmailCounts(payments)
  const cells: Cell[] = [
    { filter: "unsent", label: "Not Sent Yet", value: counts.unsent },
    { filter: "uncertain", label: "May Not Have Arrived", value: counts.uncertain },
    { filter: "sent", label: "Sent", value: counts.sent },
  ]

  return (
    <div className={stripClasses} role="group" aria-label="Payment emails">
      <span className={titleClasses}>Payment Email</span>
      {cells.map((cell) => (
        <button
          key={cell.filter}
          type="button"
          className={cn(cellClasses, active === cell.filter && activeCellClasses)}
          aria-pressed={active === cell.filter}
          onClick={() => onPick(cell.filter)}
        >
          <span className={labelClasses}>{cell.label}</span>
          <span className={valueClasses}>{cell.value}</span>
        </button>
      ))}
    </div>
  )
}
