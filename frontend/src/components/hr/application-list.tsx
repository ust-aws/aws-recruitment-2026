"use client"

import { useMemo, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
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
import { HrDeleteApplicantDialog } from "@/components/hr/hr-delete-applicant-dialog"
import { HrRecruitmentWindow } from "@/components/hr/hr-recruitment-window"
import { fullName, hasCommittee, useApplications } from "@/lib/api"
import { pageShellClasses } from "@/lib/surface"
import type { Application } from "@/lib/application-types"

const listClasses = "mt-8 flex flex-col gap-3"
const emptyClasses = "mt-8 font-sans text-sm text-prelude"

const emptyFilters: HrFilters = {
  query: "",
  committee: "",
  status: "",
}

export const HR_DELETE_NOTICE_KEY = "hr-notice-applicant-deleted"

function readDeleteNotice() {
  if (typeof window === "undefined") return null
  if (sessionStorage.getItem(HR_DELETE_NOTICE_KEY) !== "1") return null
  sessionStorage.removeItem(HR_DELETE_NOTICE_KEY)
  return { type: "success" as const, message: "Applicant deleted." }
}

export function HrApplicationList() {
  const { applications, loading, error, removeApplication } = useApplications()
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(readDeleteNotice)

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
      <HrRecruitmentWindow />
      {feedback ? (
        <ActionFeedback type={feedback.type} message={feedback.message} />
      ) : null}
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
                  onDelete={setDeleteTarget}
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
      <HrDeleteApplicantDialog
        application={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDeleted={(id) => {
          removeApplication(id)
          setFeedback({ type: "success", message: "Applicant deleted." })
        }}
      />
    </main>
  )
}
