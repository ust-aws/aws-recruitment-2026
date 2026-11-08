"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import {
  submitApplicantPayment,
  type ApplicantPayment,
} from "@/lib/api/applicant"

const formClasses = "flex flex-col gap-4"
const fieldClasses = "flex flex-col gap-2"
const helpClasses = "font-sans text-xs leading-relaxed text-prelude"
const errorClasses = "font-sans text-sm text-rose-glow"
const buttonClasses = `w-fit px-5 ${dashboardActionTargetClasses}`

const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"]

function isDriveLink(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" && DRIVE_HOSTS.includes(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function ApplicantPaymentForm({
  payment,
  onSubmitted,
}: {
  payment: ApplicantPayment
  onSubmitted: () => Promise<void>
}) {
  const method = payment.paymentMethods.gcash ? "gcash" : "bpi"
  const [referenceNumber, setReferenceNumber] = useState("")
  const [receiptUrl, setReceiptUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    setError("")
    if (!isDriveLink(receiptUrl)) {
      setError("Enter a Google Drive link to your receipt (drive.google.com).")
      return
    }
    setPending(true)
    try {
      await submitApplicantPayment({
        method,
        referenceNumber,
        receiptUrl: receiptUrl.trim(),
      })
      await onSubmitted()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not submit payment.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={formClasses}>
      <div className={fieldClasses}>
        <Label htmlFor="payment-reference">Reference number</Label>
        <Input
          id="payment-reference"
          value={referenceNumber}
          maxLength={100}
          required
          onChange={(event) => setReferenceNumber(event.target.value)}
        />
      </div>
      <div className={fieldClasses}>
        <Label htmlFor="payment-receipt-link">Receipt Google Drive link</Label>
        <Input
          id="payment-receipt-link"
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/…"
          value={receiptUrl}
          maxLength={2000}
          required
          onChange={(event) => setReceiptUrl(event.target.value)}
        />
        <p className={helpClasses}>
          Upload a screenshot of your receipt to Google Drive, set sharing to
          &ldquo;Anyone with the link&rdquo;, then paste the link here so HR can
          verify it.
        </p>
      </div>
      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
      <Button
        type="button"
        color="cyan"
        className={buttonClasses}
        disabled={pending || referenceNumber.trim().length < 4 || !receiptUrl.trim()}
        onClick={() => void submit()}
      >
        {pending ? "Submitting…" : "Submit for verification"}
      </Button>
    </div>
  )
}
