"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fieldControlClasses } from "@/lib/surface"
import { useOpenPositions } from "@/lib/api"
import type { ApplicationStatus } from "@/lib/application-types"

const rowClasses = "flex flex-col gap-3 md:flex-row md:items-center"
const searchClasses = `${fieldControlClasses} md:flex-1`
const selectClasses = `${fieldControlClasses} md:w-52`

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

export type HrFilters = {
  query: string
  committee: string
  status: "" | ApplicationStatus
}

type ApplicationFiltersProps = {
  value: HrFilters
  onChange: (patch: Partial<HrFilters>) => void
}

export function ApplicationFilters({ value, onChange }: ApplicationFiltersProps) {
  // Client-side by name. Query ?committee= is a UUID; we don't use it here.
  const { committees } = useOpenPositions()

  return (
    <div className={rowClasses}>
      <Input
        value={value.query}
        onChange={(event) => onChange({ query: event.target.value })}
        placeholder="Search applicant name..."
        className={searchClasses}
        aria-label="Search applicant name"
      />
      <Select
        value={value.committee || "all"}
        onValueChange={(next) =>
          onChange({ committee: !next || next === "all" ? "" : next })
        }
      >
        <SelectTrigger className={selectClasses}>
          <SelectValue placeholder="Committee: All">
            {value.committee || "Committee: All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Committee: All</SelectItem>
          {committees.map((committee) => (
            <SelectItem key={committee} value={committee}>
              {committee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.status || "all"}
        onValueChange={(next) =>
          onChange({
            status: (!next || next === "all" ? "" : next) as HrFilters["status"],
          })
        }
      >
        <SelectTrigger className={selectClasses}>
          <SelectValue placeholder="Status: All">
            {value.status ? STATUS_LABELS[value.status] : "Status: All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Status: All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
