"use client"

import { useMemo, useState } from "react"
import { SectionHeader } from "@/components/section-header"
import {
  ApplicationFilters,
  type HrFilters,
} from "@/components/hr/application-filters"
import { ApplicationPagination } from "@/components/hr/application-pagination"
import {
  pageCount,
  pageSlice,
} from "@/components/hr/application-pagination-utils"
import { ApplicationRow } from "@/components/hr/application-row"
import { fullName, hasCommittee, useApplications } from "@/lib/api"
import { pageShellClasses } from "@/lib/surface"

const listClasses = "mt-8 flex flex-col gap-3"
const emptyClasses = "mt-8 font-sans text-sm text-prelude"

const emptyFilters: HrFilters = {
  query: "",
  committee: "",
  status: "",
}

export function HrApplicationList() {
  const { applications, loading, error } = useApplications()
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    const committee =
      filters.committee === "all" ? "" : filters.committee
    return applications.filter((app) => {
      if (query && !fullName(app).toLowerCase().includes(query)) return false
      if (committee && !hasCommittee(app, committee)) return false
      if (filters.status && app.status !== filters.status) return false
      return true
    })
  }, [applications, filters])

  const totalPages = pageCount(visible.length)
  const safePage = Math.min(page, totalPages)
  const pageItems = pageSlice(visible, safePage)

  function onFiltersChange(patch: Partial<HrFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// APPLICATIONS"
        title="Applications Results"
        subtitle="Every R101 application so far."
      />
      <div className="mt-8">
        <ApplicationFilters value={filters} onChange={onFiltersChange} />
      </div>
      {loading ? (
        <p className={emptyClasses}>Loading applications…</p>
      ) : error ? (
        <p className={emptyClasses}>{error}</p>
      ) : visible.length === 0 ? (
        <p className={emptyClasses}>No applications match those filters.</p>
      ) : (
        <>
          <ul className={listClasses}>
            {pageItems.map((application, index) => (
              <li key={application.id}>
                <ApplicationRow
                  application={application}
                  emphasized={safePage === 1 && index === 0}
                />
              </li>
            ))}
          </ul>
          <ApplicationPagination
            total={visible.length}
            page={safePage}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  )
}
