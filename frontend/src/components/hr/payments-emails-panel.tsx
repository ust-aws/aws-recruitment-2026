"use client"

import { useState } from "react"
import { PaymentsEmailStrip } from "@/components/hr/payments-email-strip"
import { PaymentStatusPill } from "@/components/hr/payment-status-pill"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  markPaymentInvitationsDelivered,
  sendPaymentInvitations,
  type PaymentListItem,
} from "@/lib/api/payments"
import {
  fullName,
  matchesPaymentEmail,
  PAYMENT_EMAIL_LABELS,
  type PaymentEmailFilter,
} from "@/lib/payments/workspace"
import { dashboardActionTargetClasses, dashboardPanelClasses, dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const panelClasses = cn(dashboardPanelClasses, "mt-4 px-5 py-5")
const helpClasses = "font-sans text-sm leading-relaxed text-prelude"
const selectAllClasses = cn("mt-4 flex cursor-pointer items-center gap-3 px-1 font-sans text-sm text-blue-chalk", dashboardRowTargetClasses)
const listClasses = "mt-2 flex max-h-[28rem] flex-col gap-2 overflow-y-auto"
const rowClasses = cn("flex cursor-pointer items-center gap-3 rounded-[12px] bg-haiti/55 px-3 py-2", dashboardRowTargetClasses)
const whoClasses = "min-w-0 flex-1"
const nameClasses = "block truncate font-sans text-sm text-blue-chalk"
const emailClasses = "block truncate font-mono text-xs text-prelude"
const stateClasses = "hidden shrink-0 font-sans text-xs text-prelude sm:block"
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
  const allPicked = rows.length > 0 && ids.length === rows.length

  function toggle(id: string, on: boolean) {
    const next = new Set(picked)
    if (on) next.add(id)
    else next.delete(id)
    setPicked(next)
  }

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
      const waiting = alreadyWaiting > 0 ? ` ${alreadyWaiting} ${alreadyWaiting === 1 ? "was" : "were"} already waiting to send.` : ""
      return `${queued === 0 ? "Nothing new to send." : `Sending ${queued} payment ${queued === 1 ? "email" : "emails"} in the background.`}${waiting}`
    })
  const markDelivered = () =>
    run(async () => {
      const { marked } = await markPaymentInvitationsDelivered(uncertainIds)
      return `Marked ${marked} ${marked === 1 ? "email" : "emails"} as delivered.`
    })

  return (
    <>
      <PaymentsEmailStrip payments={payments} active={filter} onPick={setFilter} />
      <section className={panelClasses} aria-label="Payment emails">
        <p className={helpClasses}>
          Tick the people to send the payment email to. For ones marked &quot;May Not Have Arrived&quot;, search the
          sender account&apos;s Sent folder first: resend if it is missing, or mark it as delivered if you find it.
          Someone who already paid is not listed as not sent.
        </p>
        {rows.length === 0 ? (
          <p className={cn(helpClasses, "mt-4")}>No one is in this group.</p>
        ) : (
          <>
            <label className={selectAllClasses}>
              <Checkbox
                checked={allPicked}
                indeterminate={ids.length > 0 && !allPicked}
                onCheckedChange={(on) => setPicked(on ? new Set(rows.map((payment) => payment.paymentId)) : new Set())}
              />
              Select all ({rows.length})
            </label>
            <ul className={listClasses}>
              {rows.map((payment) => (
                <li key={payment.paymentId}>
                  <label className={rowClasses}>
                    <Checkbox
                      checked={picked.has(payment.paymentId)}
                      onCheckedChange={(on) => toggle(payment.paymentId, on)}
                    />
                    <span className={whoClasses}>
                      <span className={nameClasses}>{fullName(payment)}</span>
                      <span className={emailClasses}>{payment.email}</span>
                    </span>
                    <span className={stateClasses}>{PAYMENT_EMAIL_LABELS[payment.invitation]}</span>
                    <PaymentStatusPill status={payment.status} />
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className={actionsClasses}>
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
