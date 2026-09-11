"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { groupedCommitteesForPicker } from "@/lib/committee-groups"
import { fieldControlClasses } from "@/lib/surface"
import { useOpenPositions } from "@/lib/api"
import type { ApplicationStatus } from "@/lib/application-types"

const rowClasses =
  "flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center xl:flex-nowrap"
const searchClasses = `${fieldControlClasses} md:flex-1`
const statusSelectClasses = `${fieldControlClasses} md:w-52`
const committeeSelectClasses = `${fieldControlClasses} md:min-w-[17rem] md:max-w-[20rem] *:data-[slot=select-value]:line-clamp-2 *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left`
const archiveSelectClasses = `${fieldControlClasses} md:w-44`
const committeeMenuClasses =
  "min-w-[22rem] w-max max-w-[min(100vw-2rem,28rem)]"
const committeeItemClasses =
  "[&_span]:shrink [&_span]:whitespace-normal [&_span]:break-words [&_span]:leading-snug"
const committeeOfficeLabelClasses =
  "px-2 pt-2 font-medium text-aquamarine/90"

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

export type HrFilters = {
  query: string
  committee: string
  status: "" | ApplicationStatus
  archive: "active" | "archived"
}

type ApplicationFiltersProps = {
  value: HrFilters
  onChange: (patch: Partial<HrFilters>) => void
}

export function ApplicationFilters({ value, onChange }: ApplicationFiltersProps) {
  const { committees } = useOpenPositions()
  const committeeGroups = groupedCommitteesForPicker(committees)

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
        <SelectTrigger className={committeeSelectClasses}>
          <SelectValue placeholder="Committee: All">
            {value.committee || "Committee: All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className={committeeMenuClasses}
          alignItemWithTrigger={false}
        >
          <SelectItem value="all">Committee: All</SelectItem>
          {committeeGroups.map((group) => (
            <SelectGroup key={group.office}>
              <SelectLabel className={committeeOfficeLabelClasses}>
                {group.office}
              </SelectLabel>
              {group.committees.map((committee) => (
                <SelectItem
                  key={committee}
                  value={committee}
                  className={committeeItemClasses}
                >
                  {committee}
                </SelectItem>
              ))}
            </SelectGroup>
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
        <SelectTrigger className={statusSelectClasses}>
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
      <Select
        value={value.archive}
        onValueChange={(next) =>
          onChange({
            archive: next === "archived" ? "archived" : "active",
          })
        }
      >
        <SelectTrigger className={archiveSelectClasses}>
          <SelectValue>
            {value.archive === "archived" ? "View: Archived" : "View: Active"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">View: Active</SelectItem>
          <SelectItem value="archived">View: Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
