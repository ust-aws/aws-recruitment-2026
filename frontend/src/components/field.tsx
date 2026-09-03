"use client"

import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fieldLabelClasses, requiredMarkClasses } from "@/lib/surface"

const fieldWrapClasses = "flex flex-col gap-2"

type FieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn(fieldWrapClasses, className)}>
      <Label htmlFor={htmlFor} className={fieldLabelClasses}>
        {label}
        {required ? (
          <span className={requiredMarkClasses} aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
    </div>
  )
}
