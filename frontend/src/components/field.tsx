"use client"

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fieldLabelClasses, requiredMarkClasses } from "@/lib/surface"

const fieldWrapClasses = "flex flex-col gap-2"
const errorClasses = "text-xs text-rose-glow"

type FieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  required = false,
  error,
  className,
  children,
}: FieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const control =
    error && errorId && isValidElement(children)
      ? cloneElement(children as ReactElement<{
          "aria-describedby"?: string
          "aria-invalid"?: boolean
        }>, {
          "aria-describedby": errorId,
          "aria-invalid": true,
        })
      : children

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
      {control}
      {error ? (
        <p id={errorId} role="alert" className={errorClasses}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
