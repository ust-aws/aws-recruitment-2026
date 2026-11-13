"use client"

import { ApplicationPagination } from "@/components/hr/applications/application-pagination"
import { MemberCommitteeGroups } from "@/components/hr/members/member-committee-groups"
import { MemberTable } from "@/components/hr/members/member-table"
import { MembersMessage } from "@/components/hr/members/members-states"
import { UnpaidTable } from "@/components/hr/members/unpaid-table"
import type { MembersViewState } from "@/components/hr/members/use-members-view"
import { MEMBERS_PAGE_SIZE } from "@/lib/members/format"

const contentClasses = "mt-6 flex flex-col gap-4"

/** Why the list is empty, in the words for the scope the officer is looking at. */
function EmptyMessage({ members }: { members: MembersViewState }) {
  const nobodyOwes = members.scope === "unpaid" && members.unpaidTotal === 0
  return (
    <MembersMessage
      title={nobodyOwes ? "Everyone has paid" : "No one matches that"}
      body={nobodyOwes ? "Nobody is waiting on a payment right now." : "Try a different search or filter."}
    />
  )
}

/** The people themselves: a table, committee groups, or the not-paid table. */
function MembersList({ members }: { members: MembersViewState }) {
  if (members.scope === "unpaid") return <UnpaidTable entries={members.unpaidPage} />
  if (members.view === "committee") return <MemberCommitteeGroups groups={members.groups} />
  return <MemberTable entries={members.paidPage} />
}

/** The notice, the list and, when the list pages, the pagination. */
export function MembersPageBody({ members }: { members: MembersViewState }) {
  const paid = members.scope === "paid"
  const empty = members.total === 0
  const paged = !empty && !(paid && members.view === "committee")

  return (
    <>
      <div className={contentClasses}>
        {paid && members.split.withId === 0 ? (
          <MembersMessage
            title="No paid members yet"
            body="Members appear here with their Member ID once a payment is verified."
            linkHref="/admin/hr/payments?tab=review"
            linkLabel="Open receipts to review"
          />
        ) : null}
        {empty ? <EmptyMessage members={members} /> : <MembersList members={members} />}
      </div>
      {paged ? (
        <ApplicationPagination
          total={members.total}
          page={members.page}
          onPageChange={members.setPage}
          noun={paid ? "people" : "people not paid yet"}
          pageSize={MEMBERS_PAGE_SIZE}
        />
      ) : null}
    </>
  )
}
