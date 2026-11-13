"use client"

import { MembersPageBody } from "@/components/hr/members/members-page-body"
import { MembersPageToolbar } from "@/components/hr/members/members-page-toolbar"
import { MembersError, MembersSkeleton } from "@/components/hr/members/members-states"
import { MembersScopeTabs } from "@/components/hr/members/members-tabs"
import { useMembersData } from "@/components/hr/members/use-members-data"
import { useMembersView, type MembersViewState } from "@/components/hr/members/use-members-view"
import { SectionHeader } from "@/components/shared/section-header"
import { dashboardTitleClasses } from "@/lib/site/dashboard-surface"
import { hrPageShellClasses } from "@/lib/site/surface"

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

function membersSubtitle(members: MembersViewState) {
  const paid = plural(members.split.withId, "paid member", "paid members")
  const officers = plural(members.split.officers, "officer", "officers")
  return `${paid} · ${officers} without an ID yet · ${members.unpaidTotal} not paid yet`
}

export function HrMembersPage() {
  const { data, error, retry } = useMembersData()
  const members = useMembersView(data)

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// MEMBERSHIP"
        title="Members"
        titleClassName={dashboardTitleClasses}
        subtitle={data ? membersSubtitle(members) : undefined}
      />
      {error ? (
        <MembersError message={error} onRetry={retry} />
      ) : !data ? (
        <MembersSkeleton />
      ) : (
        <>
          <MembersScopeTabs
            scope={members.scope}
            onScopeChange={members.setScope}
            paidCount={members.roleCounts.all}
            unpaidCount={members.unpaidTotal}
          />
          <MembersPageToolbar members={members} />
          <MembersPageBody members={members} />
        </>
      )}
    </main>
  )
}
