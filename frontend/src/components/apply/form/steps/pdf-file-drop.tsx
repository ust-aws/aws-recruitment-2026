"use client"

import { useId } from "react"
import { usePdfDrop } from "@/components/apply/form/steps/use-pdf-drop"
import { Field } from "@/components/shared/field"
import { APPLICATION_DOCUMENT_PDF_MAX_SIZE_LABEL } from "@/lib/apply/field-validation"
import { cn } from "@/lib/utils"

const hintClasses = "font-sans text-xs text-prelude"
const dropErrorClasses = "font-sans text-xs text-rose-glow"
const dropClasses =
  "flex min-h-24 cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-biloba-flower/50 bg-haiti/35 px-4 py-6 text-center font-sans text-sm text-prelude transition-colors"
const dropActiveClasses = "border-aquamarine/70 bg-haiti/55 text-blue-chalk"
// One-line row for replacing a file that is already on record (dashboard).
const compactDropClasses =
  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-blue-chalk/20 bg-haiti/40 px-4 py-2 text-left font-sans text-sm text-blue-chalk transition-colors hover:border-blue-chalk/40"
const compactActiveClasses = "border-biloba-flower/60 bg-haiti/60"
const compactNameClasses = "min-w-0 truncate"
const compactActionClasses = "shrink-0 font-sans text-xs text-prelude underline underline-offset-4"
const inputClasses = "sr-only"
export const pdfDropPlaceholder = `Drag and drop or browse (.pdf, max ${APPLICATION_DOCUMENT_PDF_MAX_SIZE_LABEL})`

type PdfFileDropProps = {
  label: string
  hint?: string
  file: File | null
  displayName?: string
  required?: boolean
  error?: string
  /** A one-line row with a Replace action instead of the tall drop zone. */
  compact?: boolean
  onFile: (file: File | null) => void
}

function dropAreaClasses(compact: boolean, highlighted: boolean) {
  return compact
    ? cn(compactDropClasses, highlighted && compactActiveClasses)
    : cn(dropClasses, highlighted && dropActiveClasses)
}

/** The file name, and in the compact row also what the row does when clicked. */
function DropContent({ compact, name, hasFile }: { compact: boolean; name: string; hasFile: boolean }) {
  if (!compact) return name
  return (
    <>
      <span className={compactNameClasses}>{name}</span>
      <span className={compactActionClasses}>{hasFile ? "Change" : "Replace"}</span>
    </>
  )
}

export function PdfFileDrop({
  label,
  hint,
  file,
  displayName,
  required = true,
  error,
  compact = false,
  onFile,
}: PdfFileDropProps) {
  const id = useId()
  const { active, rejectReason, takeFile, dropHandlers } = usePdfDrop(onFile)
  const name = file?.name ?? displayName ?? pdfDropPlaceholder

  return (
    <Field label={label} htmlFor={id} required={required} error={error}>
      {hint ? <p className={hintClasses}>{hint}</p> : null}
      <label htmlFor={id} className={dropAreaClasses(compact, active || file !== null)} {...dropHandlers}>
        <DropContent compact={compact} name={name} hasFile={file !== null} />
      </label>
      <input
        id={id}
        type="file"
        accept="application/pdf"
        required={required && !file && !displayName}
        className={inputClasses}
        onChange={(event) => takeFile(event.target.files)}
      />
      {rejectReason ? (
        <p className={dropErrorClasses} role="alert">
          {rejectReason}
        </p>
      ) : null}
    </Field>
  )
}
