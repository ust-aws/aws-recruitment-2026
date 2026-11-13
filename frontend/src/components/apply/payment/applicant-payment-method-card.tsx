"use client"

import { useState } from "react"
import { QrPreview } from "@/components/shared/qr-preview"
import type { ApplicantPayment } from "@/lib/api/applicant"

const fallbackClasses =
  "grid w-56 place-items-center rounded-[14px] bg-white p-4 text-center font-sans text-xs leading-relaxed text-haiti"

export function ApplicantPaymentMethodCard({
  label,
  details,
}: {
  label: string
  details: NonNullable<ApplicantPayment["paymentMethods"]["gcash"]>
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const qrImageUrl = details.qrImageUrl

  if (!qrImageUrl || qrImageUrl === failedUrl) {
    return (
      <p className={fallbackClasses}>
        {details.accountNumber
          ? `${label}: ${details.accountNumber}`
          : "QR unavailable. Contact HR for payment details."}
      </p>
    )
  }

  return (
    <div className="w-fit" onErrorCapture={() => setFailedUrl(qrImageUrl)}>
      <QrPreview
        src={qrImageUrl}
        label={label}
        caption="Tap to enlarge"
        widthClassName="w-56"
      />
    </div>
  )
}
