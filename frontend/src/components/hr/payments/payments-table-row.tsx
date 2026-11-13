import { PaymentStatusPill } from "@/components/hr/payments/payment-status-pill"
import type { PaymentListItem } from "@/lib/api/payments"
import { formatDisplayDateTime } from "@/lib/datetime/display"
import { fullName, PAYMENT_EMAIL_LABELS, placementLabel } from "@/lib/payments/workspace"
import { cn } from "@/lib/utils"

// Rows lay out by the table's own width (it narrows when the review panel
// opens): one stacked block below @3xl, columns from there.
export const paymentRowGridClasses =
  "@3xl:grid @3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_13rem_minmax(0,9rem)_8rem] @3xl:items-center @3xl:gap-4"
const rowClasses = cn(
  "group flex w-full min-w-0 flex-col gap-1.5 px-4 py-3 text-left outline-none transition-colors",
  "hover:bg-blue-chalk/5 focus-visible:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aquamarine/50",
  "pointer-coarse:min-h-14",
  paymentRowGridClasses,
)
const selectedClasses = "bg-meteorite/45 hover:bg-meteorite/45"
const topLineClasses = "flex min-w-0 items-start justify-between gap-3 @3xl:block"
const nameClasses = "block truncate font-sans text-sm font-semibold text-blue-chalk"
const codeClasses = "block font-mono text-xs tabular-nums text-prelude"
const pillCompactClasses = "@3xl:hidden"
const committeeClasses = "block truncate font-sans text-sm text-prelude @max-3xl:hidden"
const pillWideClasses = "flex flex-wrap items-center gap-1.5 @max-3xl:hidden"
const referenceClasses = "truncate font-mono text-xs tabular-nums text-blue-chalk @max-3xl:hidden"
const submittedClasses = "font-sans text-xs tabular-nums text-prelude @max-3xl:hidden"
const metaLineClasses = "flex min-w-0 flex-wrap gap-x-2 font-sans text-xs text-prelude @3xl:hidden"
const retryClasses = "rounded-pill bg-blue-chalk/10 px-1.5 py-px font-sans text-xs text-prelude"
// Only an email that has not gone out gets a chip, so a full list stays quiet.
const emailChipClasses = "whitespace-nowrap rounded-pill border border-blue-chalk/20 px-1.5 py-px font-sans text-xs text-prelude"
const emailChipFailedClasses = "border-rose-glow/50 text-rose-glow"

function EmailChip({ payment }: { payment: PaymentListItem }) {
  if (payment.invitation === "sent") return null
  return (
    <span className={cn(emailChipClasses, payment.invitation === "failed" && emailChipFailedClasses)}>
      {PAYMENT_EMAIL_LABELS[payment.invitation]}
    </span>
  )
}

function submittedLabel(payment: PaymentListItem) {
  const submitted = payment.latestSubmission?.submittedAt
  if (!submitted) return "Not submitted"
  return formatDisplayDateTime(new Date(submitted), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

type PaymentsTableRowProps = {
  payment: PaymentListItem
  selected: boolean
  onSelect: (paymentId: string) => void
}

export function PaymentsTableRow({ payment, selected, onSelect }: PaymentsTableRowProps) {
  const reference = payment.latestSubmission?.referenceNumber ?? "—"
  const attempt = payment.latestSubmission?.attemptNumber ?? 1
  return (
    <li>
      <button
        type="button"
        data-payment-id={payment.paymentId}
        className={cn(rowClasses, selected && selectedClasses)}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(payment.paymentId)}
      >
        <span className={topLineClasses}>
          <span className="min-w-0">
            <span className={nameClasses}>{fullName(payment)}</span>
            <span className={codeClasses}>{payment.applicationCode}</span>
          </span>
          <span className={cn(pillCompactClasses, "flex flex-wrap items-center justify-end gap-1.5")}>
            <PaymentStatusPill status={payment.status} />
            <EmailChip payment={payment} />
          </span>
        </span>
        <span className={committeeClasses}>{placementLabel(payment)}</span>
        <span className={pillWideClasses}>
          <PaymentStatusPill status={payment.status} />
          {attempt > 1 ? <span className={retryClasses}>try {attempt}</span> : null}
          <EmailChip payment={payment} />
        </span>
        <span className={referenceClasses}>{reference}</span>
        <span className={submittedClasses}>{submittedLabel(payment)}</span>
        <span className={metaLineClasses}>
          <span>{placementLabel(payment)}</span>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">{reference}</span>
          <span aria-hidden>·</span>
          <span>{submittedLabel(payment)}</span>
          {attempt > 1 ? <span>· try {attempt}</span> : null}
        </span>
      </button>
    </li>
  )
}
