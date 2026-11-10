"use client"

import { useMemo, useState } from "react"
import type { MembersScope, MembersView } from "@/components/hr/members/members-tabs"
import type { DirectoryMember, PaymentListItem, PendingOfficer } from "@/lib/api/payments"
import { dateSortOptions, newestFirst, type DateSort } from "@/lib/datetime/date-sort"
import { membersToCsv, unpaidToCsv } from "@/lib/members/csv"
import {
  buildMemberEntries,
  countByFilter,
  filterMemberEntries,
  MEMBER_DATES,
  splitByMemberId,
  type MemberFilter,
} from "@/lib/members/directory"
import { csvFileName, downloadCsv } from "@/lib/members/download"
import { MEMBERS_PAGE_SIZE } from "@/lib/members/format"
import { buildCommitteeGroups } from "@/lib/members/groups"
import {
  buildUnpaidEntries,
  countByUnpaidStatus,
  filterUnpaidEntries,
  type UnpaidFilter,
} from "@/lib/members/unpaid"

type Data = { verified: DirectoryMember[]; pendingOfficers: PendingOfficer[]; payments: PaymentListItem[] }

/** Everything the Members page shows: the two scopes, their filters, paging and export. */
export function useMembersView(data: Data | null) {
  const [scope, setScopeState] = useState<MembersScope>("paid")
  const [view, setView] = useState<MembersView>("list")
  const [role, setRoleState] = useState<MemberFilter>("all")
  const [unpaidStatus, setUnpaidStatusState] = useState<UnpaidFilter>("all")
  const [query, setQueryState] = useState("")
  const [sort, setSortState] = useState<DateSort>("default")
  const [page, setPage] = useState(1)

  const entries = useMemo(() => buildMemberEntries(data?.verified ?? [], data?.pendingOfficers ?? []), [data])
  const unpaid = useMemo(() => buildUnpaidEntries(data?.payments ?? []), [data])
  const roleCounts = useMemo(() => countByFilter(entries), [entries])
  const unpaidCounts = useMemo(() => countByUnpaidStatus(unpaid), [unpaid])
  const paidFiltered = useMemo(() => filterMemberEntries(entries, role, query), [entries, role, query])
  const paidVisible = useMemo(
    () => (sort === "default" ? paidFiltered : newestFirst(paidFiltered, MEMBER_DATES[sort])),
    [paidFiltered, sort],
  )
  const unpaidVisible = useMemo(() => filterUnpaidEntries(unpaid, unpaidStatus, query), [unpaid, unpaidStatus, query])
  const groups = useMemo(() => buildCommitteeGroups(paidVisible), [paidVisible])

  const total = scope === "paid" ? paidVisible.length : unpaidVisible.length
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE)))
  const from = (safePage - 1) * MEMBERS_PAGE_SIZE

  // Changing what is shown starts again from the first page.
  const reset = <T,>(set: (value: T) => void) => (value: T) => {
    set(value)
    setPage(1)
  }

  function exportCurrent() {
    if (scope === "paid") downloadCsv(csvFileName("members"), membersToCsv(paidVisible))
    else downloadCsv(csvFileName("not-paid"), unpaidToCsv(unpaidVisible))
  }

  return {
    scope,
    view,
    role,
    unpaidStatus,
    query,
    sort,
    sortOptions: dateSortOptions(paidFiltered, MEMBER_DATES),
    page: safePage,
    total,
    setScope: reset(setScopeState),
    setView: reset(setView),
    setRole: reset(setRoleState),
    setUnpaidStatus: reset(setUnpaidStatusState),
    setQuery: reset(setQueryState),
    setSort: reset(setSortState),
    setPage,
    split: splitByMemberId(entries),
    roleCounts,
    unpaidCounts,
    paidPage: paidVisible.slice(from, from + MEMBERS_PAGE_SIZE),
    unpaidPage: unpaidVisible.slice(from, from + MEMBERS_PAGE_SIZE),
    groups,
    unpaidTotal: unpaid.length,
    exportCurrent,
  }
}

export type MembersViewState = ReturnType<typeof useMembersView>
