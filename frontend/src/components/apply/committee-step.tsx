"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/field"
import { fieldControlClasses } from "@/lib/surface"
import { useOpenPositions } from "@/lib/api"
import type { Position } from "@/lib/application-types"

const stackClasses = "flex flex-col gap-5"
const triggerClasses = `${fieldControlClasses} justify-between`
const textareaClasses = `${fieldControlClasses} h-auto min-h-28 py-3`

export type CommitteeValues = {
  firstCommittee: string
  firstPositionId: string
  secondCommittee: string
  secondPositionId: string
  motivation: string
}

type CommitteeStepProps = {
  values: CommitteeValues
  onChange: (patch: Partial<CommitteeValues>) => void
}

function CommitteeSelect({
  id,
  label,
  value,
  committees,
  disabled,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  committees: string[]
  disabled: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <Field label={label} htmlFor={id} required>
      <Select
        value={value || null}
        onValueChange={(next: string | null) => onValueChange(next ?? "")}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={triggerClasses}>
          <SelectValue placeholder="Select a committee" />
        </SelectTrigger>
        <SelectContent>
          {committees.map((committee) => (
            <SelectItem key={committee} value={committee}>
              {committee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function PositionSelect({
  id,
  label,
  committee,
  value,
  positions,
  disabled,
  onValueChange,
}: {
  id: string
  label: string
  committee: string
  value: string
  positions: Position[]
  disabled: boolean
  onValueChange: (value: string) => void
}) {
  const options = positions.filter((position) => position.committee === committee)
  const selectedTitle = options.find((position) => position.id === value)?.title

  return (
    <Field label={label} htmlFor={id} required>
      <Select
        value={value || null}
        onValueChange={(next: string | null) => onValueChange(next ?? "")}
        disabled={disabled || !committee}
      >
        <SelectTrigger id={id} className={triggerClasses}>
          <span className="flex flex-1 truncate text-left">
            {selectedTitle ?? "Select a position"}
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((position) => (
            <SelectItem key={position.id} value={position.id}>
              {position.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function CommitteeStep({ values, onChange }: CommitteeStepProps) {
  const { positions, committees, loading, error } = useOpenPositions()

  return (
    <div className={stackClasses}>
      {error ? <p className="text-sm text-aquamarine">{error}</p> : null}
      <CommitteeSelect
        id="firstCommittee"
        label="First Choice - Committee"
        value={values.firstCommittee}
        committees={committees}
        disabled={loading}
        onValueChange={(firstCommittee) =>
          onChange({ firstCommittee, firstPositionId: "" })
        }
      />
      <PositionSelect
        id="firstPosition"
        label="First Choice - Position"
        committee={values.firstCommittee}
        value={values.firstPositionId}
        positions={positions}
        disabled={loading}
        onValueChange={(firstPositionId) => onChange({ firstPositionId })}
      />
      <CommitteeSelect
        id="secondCommittee"
        label="Second Choice - Committee"
        value={values.secondCommittee}
        committees={committees}
        disabled={loading}
        onValueChange={(secondCommittee) =>
          onChange({ secondCommittee, secondPositionId: "" })
        }
      />
      <PositionSelect
        id="secondPosition"
        label="Second Choice - Position"
        committee={values.secondCommittee}
        value={values.secondPositionId}
        positions={positions}
        disabled={loading}
        onValueChange={(secondPositionId) => onChange({ secondPositionId })}
      />
      <Field label="Why do you want to join AWS Builders - UST?" htmlFor="motivation" required>
        <Textarea
          id="motivation"
          name="motivation"
          value={values.motivation}
          onChange={(e) => onChange({ motivation: e.target.value })}
          placeholder="Tell us a bit of yourself..."
          className={textareaClasses}
        />
      </Field>
    </div>
  )
}
