"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { ApplicationListSkeleton } from "@/components/hr/application-list-skeleton"
import { ApplicationExportButton } from "@/components/hr/application-export-button"
import { HrArchiveApplicantDialog } from "@/components/hr/hr-archive-applicant-dialog"
import { fullName, hasCommittee, useApplications } from "@/lib/api"
import { pageShellClasses } from "@/lib/surface"
import type { HrApplication } from "@/lib/hr-application-types"

const listClasses = "mt-8 flex flex-col gap-3"
const emptyClasses = "mt-8 font-sans text-sm text-prelude"
const toolbarClasses =
  "mt-8 flex flex-col gap-3 xl:flex-row xl:items-center"
const filtersClasses = "min-w-0 flex-1"

const emptyFilters: HrFilters = {
  query: "",
  committee: "",
  status: "",
  archive: "active",
}

export function HrApplicationList() {
  const searchParams = useSearchParams()
  const { applications, loading, error, replaceApplication } = useApplications()
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [archiveTarget, setArchiveTarget] = useState<HrApplication | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const notice = searchParams.get("notice")
  const visibleFeedback =
    feedback ??
    (notice === "archived" || notice === "restored"
      ? {
          type: "success" as const,
          message:
            notice === "archived"
              ? "Applicant archived."
              : "Applicant restored.",
        }
      : null)

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    const committee =
      filters.committee === "all" ? "" : filters.committee
    return applications.filter((app) => {
      const archived = Boolean(app.archivedAt)
      if (filters.archive === "archived" ? !archived : archived) return false
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
      {visibleFeedback ? (
        <ActionFeedback
          type={visibleFeedback.type}
          message={visibleFeedback.message}
        />
      ) : null}
      <div className={toolbarClasses}>
        <div className={filtersClasses}>
          <ApplicationFilters value={filters} onChange={onFiltersChange} />
        </div>
        <ApplicationExportButton
          applications={visible}
          archive={filters.archive}
        />
      </div>
      {loading ? (
        <ApplicationListSkeleton />
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
                  onArchive={setArchiveTarget}
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
      <HrArchiveApplicantDialog
        application={archiveTarget}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null)
        }}
        onChanged={(updated) => {
          replaceApplication(updated)
          setFeedback({
            type: "success",
            message: updated.archivedAt
              ? "Applicant archived."
              : "Applicant restored.",
          })
        }}
      />
    </main>
  )
}
