import type { ReactNode } from "react"
import { CircleCheckBig, SearchX, WalletCards } from "lucide-react"
import type { PaymentCampaign } from "@/lib/api/payments"
import { acceptingPayments } from "@/lib/payments/workspace"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const wrapClasses = cn(dashboardPanelClasses, "flex flex-col items-center gap-2 px-6 py-12 text-center")
const iconClasses = "mb-1 size-6 text-prelude"
const titleClasses = "font-sans text-base font-semibold text-blue-chalk"
const bodyClasses = "max-w-[52ch] font-sans text-sm leading-relaxed text-prelude"

function Message({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className={wrapClasses} role="status">
      {icon}
      <p className={titleClasses}>{title}</p>
      <p className={bodyClasses}>{body}</p>
      {action}
    </div>
  )
}

export function PaymentsCaughtUp({ verified }: { verified: number }) {
  return (
    <Message
      icon={<CircleCheckBig className={iconClasses} aria-hidden />}
      title="All caught up"
      body={`No receipts are waiting for review. ${verified} ${verified === 1 ? "payment is" : "payments are"} verified so far.`}
    />
  )
}

export function PaymentsNoMatch({ action }: { action: ReactNode }) {
  return (
    <Message
      icon={<SearchX className={iconClasses} aria-hidden />}
      title="No payments match"
      body="Try a different search, or clear the filters."
      action={action}
    />
  )
}

function noneBody(campaign: PaymentCampaign | null) {
  if (!campaign) return "There is no payment period yet. Set one up in Payment Setup, then open it to send invitations."
  if (!acceptingPayments(campaign)) return "The payment period is closed and nobody has a payment yet. Open it in Payment Setup to send invitations."
  return "The payment period is open, but nobody has a payment record yet."
}

export function PaymentsNone({ campaign }: { campaign: PaymentCampaign | null }) {
  return (
    <Message icon={<WalletCards className={iconClasses} aria-hidden />} title="No payments yet" body={noneBody(campaign)} />
  )
}

export function PaymentsLoadError({ message, action }: { message: string; action: ReactNode }) {
  return <Message icon={<SearchX className={iconClasses} aria-hidden />} title="Payments did not load" body={message} action={action} />
}
