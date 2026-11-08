"use client"

import { useState } from "react"
import { PaymentsEmailStrip } from "@/components/hr/payments-email-strip"
import { PaymentsPickList } from "@/components/hr/payments-pick-list"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Button } from "@/components/ui/button"
import {
  markPaymentInvitationsDelivered,
  sendPaymentInvitations,
  type PaymentListItem,
} from "@/lib/api/payments"
import {
  matchesPaymentEmail,
  PAYMENT_EMAIL_LABELS,
  type PaymentEmailFilter,
} from "@/lib/payments/workspace"
import { dashboardActionTargetClasses, dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const panelClasses = cn(dashboardPanelClasses, "mt-4 px-5 py-5")
const helpClasses = "font-sans text-sm leading-relaxed text-prelude"
const actionsClasses = "mt-4 flex flex-wrap gap-2"
const actionClasses = cn("px-4", dashboardActionTargetClasses)

type PaymentsEmailsPanelProps = {
  payments: PaymentListItem[]
  /** Reloads the payments after an action. */
  onChanged: () => Promise<void>
}

/**
 * Who has been sent the payment email. Tick people to send it (or send it again),
 * and mark the ones that may not have arrived as delivered once found in Sent.
 */
export function PaymentsEmailsPanel({ payments, onChanged }: PaymentsEmailsPanelProps) {
  const [filter, setFilter] = useState<Exclude<PaymentEmailFilter, "all">>("unsent")
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const rows = payments.filter((payment) => matchesPaymentEmail(payment, filter))
  // People can leave the list when it refreshes, so only count ids still on it.
  const ids = rows.flatMap((payment) => (picked.has(payment.paymentId) ? [payment.paymentId] : []))
  const uncertainIds = rows.flatMap((payment) =>
    picked.has(payment.paymentId) && payment.invitation === "uncertain" ? [payment.paymentId] : [],
  )
  const unpaidIds = payments.flatMap((payment) =>
    payment.status === "awaiting_payment" && !payment.archivedAt ? [payment.paymentId] : [],
  )

  async function run(action: () => Promise<string>) {
    setPending(true)
    setFeedback(null)
    try {
      setFeedback({ type: "success", message: await action() })
      setPicked(new Set())
      await onChanged()
    } catch (caught) {
      setFeedback({ type: "error", message: caught instanceof Error ? caught.message : "Could not complete that." })
    } finally {
      setPending(false)
    }
  }

  const send = () =>
    run(async () => {
      const { queued, alreadyWaiting } = await sendPaymentInvitations(ids)
      const waiting = alreadyWaiting > 0 ? ` ${alreadyWaiting} ${alreadyWaiting === 1 ? "was" : "were"} already in line; the sender was started for them.` : ""
      return `${queued === 0 ? "Nothing new to send." : `Sending ${queued} payment ${queued === 1 ? "email" : "emails"} in the background.`}${waiting}`
    })
  const markDelivered = () =>
    run(async () => {
      const { marked } = await markPaymentInvitationsDelivered(uncertainIds)
      return `Marked ${marked} ${marked === 1 ? "email" : "emails"} as delivered.`
    })
  const remindUnpaid = () =>
    run(async () => {
      const { queued, alreadyWaiting } = await sendPaymentInvitations(unpaidIds)
      const waiting = alreadyWaiting > 0
        ? ` ${alreadyWaiting} ${alreadyWaiting === 1 ? "email is" : "emails are"} already waiting to send.`
        : ""
      return `${queued === 0 ? "No new follow-up emails to send." : `Sending ${queued} payment follow-up ${queued === 1 ? "email" : "emails"} in the background.`}${waiting}`
    })

  return (
    <>
      <PaymentsEmailStrip payments={payments} active={filter} onPick={setFilter} />
      <section className={panelClasses} aria-label="Payment emails">
        <p className={helpClasses}>
          Tick the people to send the payment email to. For ones marked &quot;May Not Have Arrived&quot;, search the
          sender account&apos;s Sent folder first: resend if it is missing, or mark it as delivered if you find it.
          Someone who already paid is not listed as not sent. Follow Up Unpaid resends the payment email to everyone still awaiting payment.
        </p>
        <PaymentsPickList
          rows={rows}
          picked={picked}
          onPickedChange={setPicked}
          empty="No one is in this group."
          aside={(payment) => PAYMENT_EMAIL_LABELS[payment.invitation]}
        />
        <div className={actionsClasses}>
          <Button type="button" color="purple" className={actionClasses} disabled={pending || unpaidIds.length === 0} onClick={() => void remindUnpaid()}>
            {pending ? "Working." : `Follow Up Unpaid (${unpaidIds.length})`}
          </Button>
          <Button type="button" color="cyan" className={actionClasses} disabled={pending || ids.length === 0} onClick={() => void send()}>
            {pending ? "Working…" : `Send Selected (${ids.length})`}
          </Button>
          <Button type="button" color="purple" className={actionClasses} disabled={pending || uncertainIds.length === 0} onClick={() => void markDelivered()}>
            Mark As Delivered ({uncertainIds.length})
          </Button>
        </div>
        {feedback ? <ActionFeedback type={feedback.type} message={feedback.message} /> : null}
      </section>
    </>
  )
}
