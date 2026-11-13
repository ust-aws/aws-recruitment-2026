"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { MemberRolePill } from "@/components/hr/members/member-role-pill"
import type { MemberEntry } from "@/lib/members/directory"
import type { CommitteeGroup } from "@/lib/members/groups"
import {
  dashboardDividerClasses,
  dashboardPanelClasses,
  dashboardRowTargetClasses,
} from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const barClasses = "mb-3 flex justify-end"
const barButtonClasses =
  "min-h-9 rounded-md px-2 font-sans text-sm text-prelude underline underline-offset-4 outline-none hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/60 pointer-coarse:min-h-11"
const listClasses = cn(dashboardPanelClasses, dashboardDividerClasses, "overflow-hidden")
const summaryClasses = cn(
  dashboardRowTargetClasses,
  "flex cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-blue-chalk/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aquamarine/60 [&::-webkit-details-marker]:hidden"
)
// A committee sits under its office: indented, on a quieter ground.
const nestedSummaryClasses = "bg-haiti/30 pl-10"
const chevronClasses = "size-4 shrink-0 text-prelude transition-transform group-open:rotate-90"
const nameClasses = "min-w-0 flex-1 font-sans text-sm font-semibold text-blue-chalk"
const leadClasses = "mt-0.5 block truncate font-sans text-xs font-normal text-prelude"
const countClasses = "shrink-0 font-sans text-xs text-prelude"
const peopleClasses = "divide-y divide-blue-chalk/10 border-t border-blue-chalk/10 bg-haiti/40"
const personClasses = "flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 pl-11 font-sans text-sm text-blue-chalk"
const nestedPersonClasses = "pl-16"
const personNameClasses = "min-w-0 font-semibold"
const personMetaClasses = "min-w-0 flex-1 text-xs text-prelude"
const personIdClasses = "font-mono text-xs tabular-nums text-prelude"

function Person({ entry, nested }: { entry: MemberEntry; nested: boolean }) {
  return (
    <li className={cn(personClasses, nested && nestedPersonClasses)}>
      <span className={personNameClasses}>{entry.fullName}</span>
      <span className={personMetaClasses}>{entry.position}</span>
      <MemberRolePill role={entry.role} />
      <span className={personIdClasses}>{entry.memberId ?? "No ID yet"}</span>
    </li>
  )
}

type GroupProps = {
  group: CommitteeGroup
  open: boolean
  onToggle: (name: string, open: boolean) => void
}

function Group({ group, open, onToggle }: GroupProps) {
  const leadNames = group.leads.map((lead) => lead.fullName).join(", ")
  const nested = group.level === 1
  return (
    <details
      className="group"
      open={open}
      onToggle={(event) => onToggle(group.name, event.currentTarget.open)}
    >
      <summary className={cn(summaryClasses, nested && nestedSummaryClasses)}>
        <ChevronRight className={chevronClasses} aria-hidden />
        <span className={nameClasses}>
          {group.name}
          {leadNames ? <span className={leadClasses}>Led by {leadNames}</span> : null}
        </span>
        <span className={countClasses}>
          {group.total} {group.total === 1 ? "person" : "people"}
        </span>
      </summary>
      <ul className={peopleClasses}>
        {[...group.leads, ...group.members].map((entry) => (
          <Person key={entry.key} entry={entry} nested={nested} />
        ))}
      </ul>
    </details>
  )
}

export function MemberCommitteeGroups({ groups }: { groups: CommitteeGroup[] }) {
  const [openNames, setOpenNames] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map((group) => group.name)))
  const allOpen = groups.every((group) => openNames.has(group.name))

  function onToggle(name: string, open: boolean) {
    setOpenNames((current) => {
      if (current.has(name) === open) return current
      const next = new Set(current)
      if (open) next.add(name)
      else next.delete(name)
      return next
    })
  }

  return (
    <div>
      <div className={barClasses}>
        <button
          type="button"
          className={barButtonClasses}
          onClick={() => setOpenNames(allOpen ? new Set() : new Set(groups.map((group) => group.name)))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className={listClasses}>
        {groups.map((group) => (
          <Group key={group.name} group={group} open={openNames.has(group.name)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}
