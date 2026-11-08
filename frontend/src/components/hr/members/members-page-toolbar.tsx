"use client"

import Link from "next/link"
import { Download } from "lucide-react"
import { MembersFilterSelect, type FilterOption } from "@/components/hr/members/members-filter-select"
import { MembersViewSwitch } from "@/components/hr/members/members-tabs"
import { MembersToolbar } from "@/components/hr/members/members-toolbar"
import type { MembersViewState } from "@/components/hr/members/use-members-view"
import { Button } from "@/components/ui/button"
import { FILTER_LABELS, type MemberFilter } from "@/lib/members/directory"
import { UNPAID_FILTER_LABELS, type UnpaidFilter } from "@/lib/members/unpaid"

const exportClasses = "h-12 w-full gap-2 px-5 font-mono text-xs lg:w-auto"
const filterWidthClasses = "w-full lg:w-60"
const paymentsLinkClasses =
  "inline-flex min-h-11 items-center rounded-md px-1 font-sans text-sm text-blue-chalk underline underline-offset-4 outline-none hover:text-aquamarine focus-visible:ring-2 focus-visible:ring-aquamarine/60"
const ROLE_ORDER: MemberFilter[] = ["all", "eb", "ea", "director", "staff", "general", "adviser"]
const UNPAID_ORDER: UnpaidFilter[] = [
  "all",
  "awaiting_payment",
  "needs_resubmission",
  "pending_verification",
  "expired",
]

/** The one dropdown for the current scope: role for paid members, payment status for the rest. */
function ScopeFilter({ members }: { members: MembersViewState }) {
  if (members.scope === "paid") {
    const options: FilterOption[] = ROLE_ORDER.map((value) => ({
      value,
      label: FILTER_LABELS[value],
      count: members.roleCounts[value],
    }))
    return (
      <MembersFilterSelect
        label="Filter by role"
        value={members.role}
        options={options}
        onChange={(value) => members.setRole(value as MemberFilter)}
      />
    )
  }
  const options: FilterOption[] = UNPAID_ORDER.map((value) => ({
    value,
    label: UNPAID_FILTER_LABELS[value],
    count: members.unpaidCounts[value],
  }))
  return (
    <MembersFilterSelect
      label="Filter by payment status"
      value={members.unpaidStatus}
      options={options}
      onChange={(value) => members.setUnpaidStatus(value as UnpaidFilter)}
    />
  )
}

/** Next to the dropdown: the list / committee switch, or a way to the payments page. */
function ScopeShortcut({ members }: { members: MembersViewState }) {
  if (members.scope === "paid") return <MembersViewSwitch view={members.view} onViewChange={members.setView} />
  return (
    <Link href="/admin/hr/payments?tab=all" className={paymentsLinkClasses}>
      Open payments
    </Link>
  )
}

/** Search, the filter for this scope, and the CSV export. */
export function MembersPageToolbar({ members }: { members: MembersViewState }) {
  const paid = members.scope === "paid"
  const filtered = paid ? members.role !== "all" : members.unpaidStatus !== "all"

  return (
    <MembersToolbar
      query={members.query}
      onQueryChange={members.setQuery}
      placeholder={paid ? "Search name or ID" : "Search name or email"}
      activeFilters={filtered ? 1 : 0}
      filters={
        <>
          <div className={filterWidthClasses}>
            <ScopeFilter members={members} />
          </div>
          <ScopeShortcut members={members} />
        </>
      }
      actions={
        <Button color="purple" className={exportClasses} disabled={members.total === 0} onClick={members.exportCurrent}>
          <Download />
          Export CSV ({members.total})
        </Button>
      }
    />
  )
}
