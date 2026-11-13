"use client"

import { useState } from "react"
import { PaymentQrField } from "@/components/hr/payments/setup/hr-payment-qr-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  savePaymentDetails,
  type PaymentCampaign,
} from "@/lib/api/payments"
import { uploadPaymentQr } from "@/lib/payments/payment-qr-upload"

const fieldClasses = "flex max-w-xs flex-col gap-2"
const errorClasses = "mt-3 font-sans text-sm text-rose-glow"
// The two GCash QRs sit side by side on wide screens and stack on small ones.
const qrGridClasses = "grid gap-x-8 @2xl:grid-cols-2"

export function HrPaymentDetailsForm({ campaign, onSaved }: { campaign: PaymentCampaign; onSaved: (campaign: PaymentCampaign) => void }) {
  const [form, setForm] = useState(() => ({
    amount: String((campaign.amountCents ?? 25_000) / 100),
  }))
  const [gcashQr, setGcashQr] = useState<File | null>(null)
  const [coreQr, setCoreQr] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    setPending(true)
    setError("")
    try {
      if (gcashQr) await uploadPaymentQr("gcash", gcashQr)
      if (coreQr) await uploadPaymentQr("gcash_core", coreQr)
      const saved = await savePaymentDetails({
        amountCents: Math.round(Number(form.amount) * 100),
        gcashAccountName: campaign.gcashAccountName,
        gcashAccountNumber: campaign.gcashAccountNumber,
        bpiAccountName: campaign.bpiAccountName,
        bpiAccountNumber: campaign.bpiAccountNumber,
      })
      setGcashQr(null)
      setCoreQr(null)
      onSaved(saved)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save payment details.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className={fieldClasses}>
        <Label htmlFor="payment-amount">Fixed amount (PHP)</Label>
        <Input id="payment-amount" type="number" min="1" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
      </div>
      <div className={qrGridClasses}>
        <PaymentQrField
          id="gcash-core-qr"
          label="GCash — Chief Finance Officer"
          audience="For accepted committee members: Executive Associates and committee staff, plus the Executive Board and Directors."
          savedPreviewUrl={campaign.gcashCoreQrPreviewUrl ?? null}
          hasSavedQr={Boolean(campaign.gcashCoreQrImageKey)}
          qrFile={coreQr}
          savedFileName={campaign.gcashCoreQrFileName ?? null}
          onQr={setCoreQr}
        />
        <PaymentQrField
          id="gcash-members-qr"
          label="GCash — Director for Finance"
          audience="For general members, including applicants who were not selected or who declined a redirect."
          savedPreviewUrl={campaign.gcashQrPreviewUrl ?? null}
          hasSavedQr={Boolean(campaign.gcashQrImageKey || campaign.gcashQrImageUrl)}
          qrFile={gcashQr}
          savedFileName={campaign.gcashQrFileName ?? null}
          onQr={setGcashQr}
        />
      </div>
      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
      <Button type="button" color="purple" className="mt-5" disabled={pending} onClick={() => void save()}>{pending ? "Saving…" : "Save payment details"}</Button>
    </div>
  )
}
