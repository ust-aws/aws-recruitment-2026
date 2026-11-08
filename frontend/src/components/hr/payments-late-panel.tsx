"use client"

import { useState } from "react"
import { PaymentsPickList } from "@/components/hr/payments-pick-list"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Button } from "@/components/ui/button"
import { DatetimePicker } from "@/components/ui/datetime-picker"
import { allowLatePayment, closeLatePayment, type PaymentListItem } from "@/lib/api/payments"
import { dateYmdFromDate, endOfDayIsoFromYmd } from "@/lib/datetime/date-local"
import { formatDisplayDateTime } from "@/lib/datetime/display"
import { owesPayment } from "@/lib/payments/workspace"
import { formatSubheaderLabel } from "@/lib/site/button-label"
import { dashboardActionTargetClasses, dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { subheaderLabelClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const panelClasses = cn(dashboardPanelClasses, "mt-4 px-5 py-5")
const helpClasses = "font-sans text-sm leading-relaxed text-prelude"
const fieldClasses = "mt-4 flex max-w-xs flex-col gap-2"
const actionsClasses = "mt-4 flex flex-wrap gap-3"
const actionClasses = cn("px-4", dashboardActionTargetClasses)

const shortDate = (iso: string) =>
  formatDisplayDateTime(new Date(iso), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
const tomorrow = () => dateYmdFromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))

type PaymentsLatePanelProps = {
  payments: PaymentListItem[]
  /** Reloads the payments after an action. */
  onChanged: () => Promise<void>
}

/** Lets chosen people who still owe pay until a date, without emailing anyone. */
export function PaymentsLatePanel({ payments, onChanged }: PaymentsLatePanelProps) {
  const [until, setUntil] = useState(tomorrow)
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const rows = payments.filter(owesPayment)
  // People can leave the list when it refreshes, so only count ids still on it.
  const ids = rows.flatMap((payment) => (picked.has(payment.paymentId) ? [payment.paymentId] : []))
  const closeIds = rows.flatMap((payment) => (picked.has(payment.paymentId) && payment.personalDeadlineAt ? [payment.paymentId] : []))

  async function run(action: () => Promise<string>, failure: string) {
    setPending(true)
    setFeedback(null)
    try {
      setFeedback({ type: "success", message: await action() })
      setPicked(new Set())
      await onChanged()
    } catch (caught) {
      setFeedback({ type: "error", message: caught instanceof Error ? caught.message : failure })
    } finally {
      setPending(false)
    }
  }

  function letThemPay() {
    const untilIso = endOfDayIsoFromYmd(until)
    if (!untilIso) return setFeedback({ type: "error", message: "Pick the date they can pay until." })
    void run(async () => {
      const { opened, skipped } = await allowLatePayment(ids, untilIso)
      const left = skipped > 0 ? ` ${skipped} had already paid or sent a receipt and were left alone.` : ""
      return `${opened} ${opened === 1 ? "person" : "people"} can now pay until ${shortDate(untilIso)}. No emails were sent.${left}`
    }, "Could not open their payments.")
  }

  function closeForThem() {
    void run(async () => {
      const { closed } = await closeLatePayment(closeIds)
      return `Closed the late payment for ${closed} ${closed === 1 ? "person" : "people"}. They are back on the period's own dates.`
    }, "Could not close their late payment.")
  }

  return (
    <section className={panelClasses} aria-label="Late payments">
      <p className={helpClasses}>
        Tick people who haven&apos;t paid and pick the last day they can pay. They can pay until then even if payments
        are closed for everyone else. No email is sent, so let them know yourself. To take it back, tick them and
        close their late payment.
      </p>
      <div className={fieldClasses}>
        <label htmlFor="late-until" className={subheaderLabelClasses}>{formatSubheaderLabel("Can pay until")}</label>
        <DatetimePicker id="late-until" dateOnly value={until} onChange={setUntil} required />
      </div>
      <PaymentsPickList
        rows={rows}
        picked={picked}
        onPickedChange={setPicked}
        empty="Everyone has paid or sent a receipt."
        aside={(payment) => (payment.personalDeadlineAt ? `Until ${shortDate(payment.personalDeadlineAt)}` : null)}
      />
      <div className={actionsClasses}>
        <Button type="button" color="cyan" className={actionClasses} disabled={pending || ids.length === 0} onClick={letThemPay}>
          {pending ? "Working…" : `Let Selected Pay (${ids.length})`}
        </Button>
        <Button type="button" variant="outline" className={actionClasses} disabled={pending || closeIds.length === 0} onClick={closeForThem}>
          {`Close Late Payment (${closeIds.length})`}
        </Button>
      </div>
      {feedback ? <ActionFeedback type={feedback.type} message={feedback.message} /> : null}
    </section>
  )
}
