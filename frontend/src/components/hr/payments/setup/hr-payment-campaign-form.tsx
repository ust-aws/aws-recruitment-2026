"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DatetimePicker } from "@/components/ui/datetime-picker"
import {
  savePaymentSchedule,
  type PaymentCampaign,
  type SavedPaymentSchedule,
} from "@/lib/api/payments"
import {
  dateYmdFromDate,
  endOfDayIsoFromYmd,
  paymentOpensAtIsoFromYmd,
} from "@/lib/datetime/date-local"
import { formatSubheaderLabel } from "@/lib/site/button-label"
import { subheaderLabelClasses } from "@/lib/site/surface"

const gridClasses = "grid gap-4 @sm:grid-cols-2"
const fieldClasses = "flex flex-col gap-2"
const errorClasses = "mt-3 font-sans text-sm text-rose-glow"
const hintClasses = "mt-3 font-sans text-sm text-prelude"

function defaults(campaign: PaymentCampaign | null) {
  const opensAt = campaign ? new Date(campaign.opensAt) : new Date()
  const deadlineAt = campaign
    ? new Date(campaign.deadlineAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return {
    opensAt: dateYmdFromDate(opensAt),
    deadlineAt: dateYmdFromDate(deadlineAt),
  }
}

export function HrPaymentScheduleForm({ campaign, onSaved }: { campaign: PaymentCampaign | null; onSaved: (saved: SavedPaymentSchedule) => void }) {
  const [form, setForm] = useState(() => defaults(campaign))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  // Dates are YYYY-MM-DD, so comparing them as text compares them as dates.
  const extending = Boolean(campaign?.isOpen) && form.deadlineAt > defaults(campaign).deadlineAt

  async function save() {
    setPending(true)
    setError("")
    try {
      const opensAt = paymentOpensAtIsoFromYmd(form.opensAt)
      const deadlineAt = endOfDayIsoFromYmd(form.deadlineAt)
      if (!opensAt || !deadlineAt) {
        setError("Choose valid opening and deadline dates.")
        return
      }
      const saved = await savePaymentSchedule({
        opensAt,
        deadlineAt,
        generalChatLink: campaign?.generalChatLink ?? null,
        coreTeamChatLink: campaign?.coreTeamChatLink ?? null,
        committeeChatLinks: campaign?.committeeChatLinks ?? [],
      })
      onSaved(saved)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the payment period.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className={gridClasses}>
        <div className={fieldClasses}>
          <FieldLabel htmlFor="payment-opens">Opening date</FieldLabel>
          <DatetimePicker
            id="payment-opens"
            dateOnly
            value={form.opensAt}
            onChange={(opensAt) => setForm((current) => ({ ...current, opensAt }))}
            required
          />
        </div>
        <div className={fieldClasses}>
          <FieldLabel htmlFor="payment-deadline">Deadline</FieldLabel>
          <DatetimePicker
            id="payment-deadline"
            dateOnly
            value={form.deadlineAt}
            onChange={(deadlineAt) => setForm((current) => ({ ...current, deadlineAt }))}
            required
          />
        </div>
      </div>
      {extending ? <p className={hintClasses}>Everyone who hasn&apos;t paid will be emailed the new deadline.</p> : null}
      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
      <Button type="button" color="purple" className="mt-5" disabled={pending} onClick={() => void save()}>{pending ? "Saving…" : "Save payment period"}</Button>
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className={subheaderLabelClasses}>
      {formatSubheaderLabel(children)}
    </label>
  )
}
