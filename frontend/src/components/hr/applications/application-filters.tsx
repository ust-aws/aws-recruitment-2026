"use client"

import { useState, type ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { ApplicationFilterSelects } from "@/components/hr/applications/application-filter-selects"
import { Input } from "@/components/ui/input"
import { fieldControlClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"
import type { ApplicationType } from "@/lib/types/application"

const wrapClasses = "flex flex-col gap-3"
const topRowClasses = "flex flex-col gap-3 lg:flex-row lg:items-start"
const searchClasses = cn(fieldControlClasses, "border border-blue-chalk/20 lg:flex-1")
const actionsClasses = "grid grid-cols-2 gap-3 lg:flex lg:shrink-0"
const filtersToggleClasses =
  "flex h-12 w-full cursor-pointer items-center justify-between rounded-[20px] border border-blue-chalk/20 bg-haiti/70 px-4 font-sans text-sm text-blue-chalk outline-none transition-colors hover:border-biloba-flower/50 focus-visible:ring-2 focus-visible:ring-aquamarine/40 lg:hidden"
const activeCountClasses =
  "rounded-pill bg-aquamarine px-2 py-0.5 font-sans text-xs font-semibold text-haiti"
const selectsClasses = "grid-cols-1 gap-3 lg:grid lg:grid-cols-3"

export type HrFilters = {
  query: string
  committee: string
  status: "" | "pending" | "approved" | "rejected" | "redirected"
  applicationType: "" | ApplicationType
}

type ApplicationFiltersProps = {
  value: HrFilters
  onChange: (patch: Partial<HrFilters>) => void
  /** Page actions (add, export) that sit beside the search box. */
  actions?: ReactNode
}

function activeFilterCount(value: HrFilters) {
  return [value.committee, value.status, value.applicationType].filter(Boolean).length
}

export function ApplicationFilters({ value, onChange, actions }: ApplicationFiltersProps) {
  const activeCount = activeFilterCount(value)
  const [open, setOpen] = useState(activeCount > 0)

  return (
    <div className={wrapClasses}>
      <div className={topRowClasses}>
        <Input
          value={value.query}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder="Search applicant name..."
          className={searchClasses}
          aria-label="Search applicant name"
        />
        {actions ? <div className={actionsClasses}>{actions}</div> : null}
      </div>
      <button
        type="button"
        className={filtersToggleClasses}
        aria-expanded={open}
        aria-controls="application-filter-selects"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-prelude" aria-hidden />
          Filters
        </span>
        {activeCount > 0 ? (
          <span className={activeCountClasses}>{activeCount} active</span>
        ) : null}
      </button>
      <div
        id="application-filter-selects"
        className={cn(selectsClasses, open ? "grid" : "hidden")}
      >
        <ApplicationFilterSelects value={value} onChange={onChange} />
      </div>
    </div>
  )
}
