import { paymentRowGridClasses, PaymentsTableRow } from "@/components/hr/payments/payments-table-row"
import type { PaymentListItem } from "@/lib/api/payments"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const wrapClasses = cn(dashboardPanelClasses, "@container min-w-0 overflow-hidden")
const headClasses = cn(
  "hidden border-b border-blue-chalk/10 px-4 py-2.5 font-sans text-xs text-prelude",
  paymentRowGridClasses,
)
const listClasses = "divide-y divide-blue-chalk/10"

type PaymentsTableProps = {
  payments: PaymentListItem[]
  selectedId: string | null
  onSelect: (paymentId: string) => void
  label: string
}

export function PaymentsTable({ payments, selectedId, onSelect, label }: PaymentsTableProps) {
  return (
    <div className={wrapClasses}>
      <div className={headClasses} aria-hidden>
        <span>Applicant</span>
        <span>Committee</span>
        <span>Status</span>
        <span>Reference</span>
        <span>Submitted</span>
      </div>
      <ul className={listClasses} aria-label={label}>
        {payments.map((payment) => (
          <PaymentsTableRow
            key={payment.paymentId}
            payment={payment}
            selected={payment.paymentId === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
}
