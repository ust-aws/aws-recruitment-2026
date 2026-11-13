"use client"

import { type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PositionApprovalTarget } from "@/lib/api"

type HrPositionApprovalTargetRowProps = {
  position: PositionApprovalTarget
  value: string
  disabled: boolean
  pending: boolean
  onChange: (value: string) => void
  onSave: () => void
}

const rowClasses =
  "rounded-[14px] border border-blue-chalk/15 bg-haiti/45 p-4"
const formClasses = "mt-3 flex items-end gap-3"
const labelClasses = "flex min-w-0 flex-1 flex-col gap-2"
const inputClasses =
  "max-w-32 [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

export function HrPositionApprovalTargetRow({
  position,
  value,
  disabled,
  pending,
  onChange,
  onSave,
}: HrPositionApprovalTargetRowProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave()
  }

  return (
    <article className={rowClasses}>
      <p className="font-sans text-sm font-semibold text-blue-chalk">
        {position.title}
      </p>
      <p className="mt-1 font-sans text-xs text-prelude">
        {position.committee}
      </p>
      <form className={formClasses} onSubmit={submit}>
        <Label className={labelClasses} htmlFor={`target-${position.id}`}>
          Applicants wanted
          <Input
            className={inputClasses}
            id={`target-${position.id}`}
            type="number"
            min={0}
            step={1}
            required
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        </Label>
        <Button
          type="submit"
          size="sm"
          color="cyan"
          disabled={disabled || value === String(position.openSlots)}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </article>
  )
}
