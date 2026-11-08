import type { PaymentStatus } from "@/lib/api/payments"
import { PAYMENT_STATUS_LABELS } from "@/lib/payments/workspace"
import { cn } from "@/lib/utils"

const pillClasses =
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-0.5 font-sans text-xs"
const dotClasses = "size-1.5 rounded-full bg-current"
// Rose only where something went wrong; verified reads as done, not as action.
const toneClasses: Record<PaymentStatus, string> = {
  pending_verification: "border-blue-chalk/30 bg-blue-chalk/5 text-blue-chalk",
  needs_resubmission: "border-rose-blush/45 bg-rose-deep/25 text-rose-glow",
  awaiting_payment: "border-blue-chalk/15 text-prelude",
  expired: "border-rose-blush/35 text-rose-glow",
  verified: "border-biloba-flower/40 bg-biloba-flower/15 text-blue-chalk",
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn(pillClasses, toneClasses[status])}>
      <span className={dotClasses} aria-hidden />
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
