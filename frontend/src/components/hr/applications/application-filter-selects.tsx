"use client"

import { useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { HrFilters } from "@/components/hr/applications/application-filters"
import { HrCommitteeFilterPicker } from "@/components/hr/applications/hr-committee-filter-picker"
import { groupedCommitteesForPicker } from "@/lib/apply/committee-groups"
import { hrFilterSelectClasses } from "@/lib/site/surface"
import { useOpenPositions } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ApplicationType } from "@/lib/types/application"
import type { ApplicantListStatusTag } from "@/lib/hr/application-display"

const selectClasses = cn(hrFilterSelectClasses, "w-full")

const STATUS_LABELS: Record<ApplicantListStatusTag, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  redirected: "Redirected",
}

function statusFilterLabel(status: HrFilters["status"]) {
  if (!status) return "All Statuses"
  if (status === "approved") return STATUS_LABELS.accepted
  return STATUS_LABELS[status]
}

const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  position: "Committee Positions",
  member: "Member-Only",
}

type ApplicationFilterSelectsProps = {
  value: HrFilters
  onChange: (patch: Partial<HrFilters>) => void
}

export function ApplicationFilterSelects({ value, onChange }: ApplicationFilterSelectsProps) {
  const { committees } = useOpenPositions()
  const committeeGroups = useMemo(
    () => groupedCommitteesForPicker(committees),
    [committees]
  )

  return (
    <>
      <Select
        value={value.applicationType || "all"}
        onValueChange={(next) =>
          onChange({
            applicationType: (!next || next === "all"
              ? ""
              : next) as HrFilters["applicationType"],
          })
        }
      >
        <SelectTrigger className={selectClasses} aria-label="Filter by application type">
          <SelectValue placeholder="All Application Types">
            {value.applicationType
              ? APPLICATION_TYPE_LABELS[value.applicationType]
              : "All Application Types"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Application Types</SelectItem>
          <SelectItem value="position">Committee Positions</SelectItem>
          <SelectItem value="member">Member-Only</SelectItem>
        </SelectContent>
      </Select>
      <HrCommitteeFilterPicker
        value={value.committee}
        groups={committeeGroups}
        onChange={(committee) => onChange({ committee })}
      />
      <Select
        value={value.status || "all"}
        onValueChange={(next) =>
          onChange({
            status: (!next || next === "all"
              ? ""
              : next) as HrFilters["status"],
          })
        }
      >
        <SelectTrigger className={selectClasses} aria-label="Filter by status">
          <SelectValue placeholder="All Statuses">
            {statusFilterLabel(value.status)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="redirected">Redirected</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
