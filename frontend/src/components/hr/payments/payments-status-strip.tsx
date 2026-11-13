import type { PaymentDashboard, PaymentStatus } from "@/lib/api/payments"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// One row of counts in place of six cards. Each count is a filter; only a
// waiting queue lights up, because that is the work.
const stripClasses = cn(
  dashboardPanelClasses,
  "mt-6 grid grid-cols-2 divide-blue-chalk/10 overflow-hidden sm:grid-cols-3 lg:grid-cols-6 lg:divide-x",
)
const cellClasses =
  "group flex min-w-0 flex-col items-start gap-1 px-4 py-3 text-left outline-none transition-colors hover:bg-blue-chalk/5 focus-visible:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aquamarine/50 pointer-coarse:min-h-16"
const activeCellClasses = "bg-blue-chalk/8 shadow-[inset_0_-2px_0_var(--biloba-flower)]"
const labelClasses = "font-sans text-xs text-prelude"
const valueClasses = "font-sans text-2xl font-bold tabular-nums leading-none text-blue-chalk"
const liveValueClasses = "text-aquamarine"

export type StripFilter = "all" | PaymentStatus

type Cell = { filter: StripFilter; label: string; value: number }

function cells(summary: PaymentDashboard["summary"]): Cell[] {
  return [
    { filter: "pending_verification", label: "Pending Verification", value: summary.pendingVerification },
    { filter: "awaiting_payment", label: "Awaiting Payment", value: summary.awaitingPayment },
    { filter: "needs_resubmission", label: "Needs Resubmission", value: summary.needsResubmission },
    { filter: "expired", label: "Expired", value: summary.expired },
    { filter: "verified", label: "Verified", value: summary.verified },
    { filter: "all", label: "Eligible", value: summary.totalEligible },
  ]
}

type PaymentsStatusStripProps = {
  summary: PaymentDashboard["summary"]
  /** The count currently filtering the list, if any. */
  active: StripFilter | null
  onPick: (filter: StripFilter) => void
}

export function PaymentsStatusStrip({ summary, active, onPick }: PaymentsStatusStripProps) {
  return (
    <div className={stripClasses} role="group" aria-label="Payments by status">
      {cells(summary).map((cell) => (
        <button
          key={cell.filter}
          type="button"
          className={cn(cellClasses, active === cell.filter && activeCellClasses)}
          aria-pressed={active === cell.filter}
          onClick={() => onPick(cell.filter)}
        >
          <span className={labelClasses}>{cell.label}</span>
          <span
            className={cn(
              valueClasses,
              cell.filter === "pending_verification" && cell.value > 0 && liveValueClasses,
            )}
          >
            {cell.value}
          </span>
        </button>
      ))}
    </div>
  )
}
