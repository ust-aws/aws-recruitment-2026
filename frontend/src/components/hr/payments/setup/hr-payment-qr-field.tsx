"use client"

import { useEffect, useRef, useState } from "react"
import { QrPreview } from "@/components/shared/qr-preview"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const sectionClasses = "mt-5 border-t border-blue-chalk/15 pt-5"
const sectionTitleClasses = "font-sans text-sm font-semibold text-blue-chalk"
const audienceClasses = "mt-1 font-sans text-xs text-prelude"
const headerClasses = "mb-3"
const rowClasses = "flex flex-col gap-4 sm:flex-row sm:items-start"
const fieldClasses = "flex min-w-0 flex-1 flex-col gap-2"
const fileNameClasses = "truncate font-sans text-sm font-medium text-blue-chalk"
const helpClasses = "font-sans text-xs text-prelude"
const actionsClasses = "mt-1 flex flex-wrap gap-2"
const actionButtonClasses = "h-9 px-4 text-xs"

type PaymentQrFieldProps = {
  id: string
  label: string
  /** Who pays through this QR, shown under the title. */
  audience?: string
  savedPreviewUrl: string | null
  savedFileName: string | null
  hasSavedQr: boolean
  qrFile: File | null
  onQr: (value: File | null) => void
}

/**
 * Preview link for a picked file. It is created in the file-pick event (not
 * during render) and released when replaced or when the field unmounts.
 */
function useFilePreviewUrl(file: File | null) {
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null)
  const current = picked?.url
  useEffect(() => {
    if (!current) return
    return () => URL.revokeObjectURL(current)
  }, [current])
  const pick = (next: File | null) =>
    setPicked(next ? { file: next, url: URL.createObjectURL(next) } : null)
  return { url: file && picked?.file === file ? picked.url : null, pick }
}

export function PaymentQrField({
  id,
  label,
  audience,
  savedPreviewUrl,
  savedFileName,
  hasSavedQr,
  qrFile,
  onQr,
}: PaymentQrFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { url: pendingPreviewUrl, pick } = useFilePreviewUrl(qrFile)
  const previewUrl = pendingPreviewUrl ?? savedPreviewUrl
  const fileName = qrFile?.name ?? (hasSavedQr ? savedFileName ?? `${label} QR` : null)
  const help = qrFile
    ? "Not saved yet. Press Save Payment Details to upload it."
    : hasSavedQr
      ? "This QR is saved and shown to applicants."
      : "JPEG, PNG, or WebP. Maximum size: 5 MB."

  return (
    <div className={sectionClasses}>
      <div className={headerClasses}>
        <p className={sectionTitleClasses}>{label}</p>
        {audience ? <p className={audienceClasses}>{audience}</p> : null}
      </div>
      <div className={rowClasses}>
        {previewUrl ? (
          <QrPreview
            src={previewUrl}
            label={label}
            caption={qrFile ? "New (unsaved)" : "Saved QR"}
            fileName={fileName}
          />
        ) : null}
        <div className={fieldClasses}>
          <Label htmlFor={id}>Official QR image</Label>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              pick(file)
              onQr(file)
              event.target.value = ""
            }}
          />
          {fileName ? <p className={fileNameClasses}>{fileName}</p> : null}
          <p className={helpClasses}>{help}</p>
          <div className={actionsClasses}>
            <Button type="button" color="purple" className={actionButtonClasses} onClick={() => inputRef.current?.click()}>
              {qrFile || hasSavedQr ? "Replace QR" : "Upload QR"}
            </Button>
            {qrFile ? (
              <Button type="button" color="purple" className={actionButtonClasses} onClick={() => onQr(null)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
