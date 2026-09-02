"use client"

import { useId, useState } from "react"
import { Field } from "@/components/field"
import { cn } from "@/lib/utils"

const stackClasses = "flex flex-col gap-5"
const dropClasses =
  "flex min-h-24 cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-biloba-flower/50 bg-haiti/35 px-4 py-6 text-center font-sans text-sm text-prelude transition-colors"
const dropActiveClasses = "border-aquamarine/70 bg-haiti/55 text-blue-chalk"
const inputClasses = "sr-only"

type FileDropProps = {
  label: string
  file: File | null
  onFile: (file: File | null) => void
}

function FileDrop({ label, file, onFile }: FileDropProps) {
  const id = useId()
  const [active, setActive] = useState(false)

  function takeFile(list: FileList | null) {
    const next = list?.[0]
    if (!next) return
    if (next.type !== "application/pdf") return
    onFile(next)
  }

  return (
    <Field label={label} htmlFor={id} required>
      <label
        htmlFor={id}
        className={cn(dropClasses, (active || file) && dropActiveClasses)}
        onDragOver={(event) => {
          event.preventDefault()
          setActive(true)
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setActive(false)
          takeFile(event.dataTransfer.files)
        }}
      >
        {file
          ? file.name
          : "drag and drop or click to browse (.pdf)"}
      </label>
      <input
        id={id}
        type="file"
        accept="application/pdf"
        className={inputClasses}
        onChange={(event) => takeFile(event.target.files)}
      />
    </Field>
  )
}

export type UploadValues = {
  resume: File | null
  transcript: File | null
}

type UploadStepProps = {
  values: UploadValues
  onChange: (patch: Partial<UploadValues>) => void
}

export function UploadStep({ values, onChange }: UploadStepProps) {
  return (
    <div className={stackClasses}>
      <FileDrop
        label="Resume"
        file={values.resume}
        onFile={(resume) => onChange({ resume })}
      />
      <FileDrop
        label="Transcript of Records (TOR)"
        file={values.transcript}
        onFile={(transcript) => onChange({ transcript })}
      />
    </div>
  )
}
