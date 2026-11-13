"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COMMITTEE_OFFICE_GROUPS } from "@/lib/apply/committee-groups"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const selectClasses = cn(
  fieldControlClasses,
  "w-full max-w-md cursor-pointer justify-between",
)
const itemClasses = "cursor-pointer"
const labelClasses = "font-sans text-sm font-medium text-blue-chalk"

type HrCommitteeOfficeSelectProps = {
  value: string
  onChange: (office: string) => void
  extraOffices?: readonly string[]
}

export function HrCommitteeOfficeSelect({
  value,
  onChange,
  extraOffices = [],
}: HrCommitteeOfficeSelectProps) {
  const known = new Set(COMMITTEE_OFFICE_GROUPS.map((group) => group.office))
  const offices = [
    ...COMMITTEE_OFFICE_GROUPS.map((group) => group.office),
    ...extraOffices.filter((office) => office && !known.has(office)),
  ]

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClasses} id="hr-committee-office-label">
        Office
      </span>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next)
        }}
      >
        <SelectTrigger
          className={selectClasses}
          aria-labelledby="hr-committee-office-label"
        >
          <SelectValue placeholder="Select office" />
        </SelectTrigger>
        <SelectContent>
          {offices.map((office) => (
            <SelectItem key={office} value={office} className={itemClasses}>
              {office}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
