"use client"

import { useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { SectionHeader } from "@/components/shared/section-header"
import { APPLICATION_TABLE_PAGE_SIZE } from "@/components/hr/applications/application-pagination-utils"
import { ApplicationListResults } from "@/components/hr/applications/application-list-results"
import { hrApplicationListNoticeFeedback } from "@/components/hr/applications/application-list-feedback"
import {
  HrApplicationListDialogs,
  useHrListDialogTargets,
  type ListFeedback,
} from "@/components/hr/applications/dialogs/hr-application-list-dialogs"
import { HrApplicationListToolbar } from "@/components/hr/applications/hr-application-list-toolbar"
import { useHrListUrlState } from "@/components/hr/applications/use-hr-list-url-state"
import { useApplications } from "@/lib/api"
import { useRecruitmentTrack } from "@/lib/recruitment-track"
import type { HrListSearchParamsInput } from "@/lib/hr/filters-search-params"
import { dashboardTitleClasses } from "@/lib/site/dashboard-surface"
import { hrPageShellClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

type HrApplicationListProps = {
  variant?: "active" | "archived"
  notice?: string
  listSearch?: HrListSearchParamsInput
}

export function HrApplicationList({
  variant = "active",
  notice,
  listSearch,
}: HrApplicationListProps) {
  const isArchivedView = variant === "archived"
  const hunt = useRecruitmentTrack() === "officer_hunt"
  const urlState = useHrListUrlState(listSearch, notice)
  const { filters, page } = urlState
  const { applications, total, loading, error, refreshApplications } =
    useApplications({
      query: filters.query.trim(),
      committeeName: filters.committee || undefined,
      status: filters.status || undefined,
      applicationType: filters.applicationType || undefined,
      archive: variant,
      page,
      pageSize: APPLICATION_TABLE_PAGE_SIZE,
    })
  const targets = useHrListDialogTargets()
  const [feedback, setFeedback] = useState<ListFeedback | null>(null)
  const visibleFeedback = feedback ?? hrApplicationListNoticeFeedback(notice)

  function onListChanged(resetPage: boolean) {
    if (resetPage) urlState.resetToFirstPage()
    refreshApplications()
  }

  return (
    <main className={cn(hrPageShellClasses, "min-w-0 max-w-full overflow-x-clip")}>
      <SectionHeader
        eyebrow={hunt ? "// OFFICER HUNT" : undefined}
        title={
          isArchivedView
            ? "Archived Applications"
            : hunt
              ? "Officer Hunt Applications"
              : "Applications"
        }
        titleClassName={dashboardTitleClasses}
        subtitle={
          isArchivedView
            ? "Restore applicants to active review or delete permanently to free their interview slot."
            : hunt
              ? "Review who applied for the board, director and executive assistant seats, update decisions, and open each profile."
              : "Review active applicants, update decisions, and open each profile for complete details."
        }
      />
      {visibleFeedback ? (
        <ActionFeedback
          type={visibleFeedback.type}
          message={visibleFeedback.message}
        />
      ) : null}
      <HrApplicationListToolbar
        variant={variant}
        filters={filters}
        total={total}
        onFiltersChange={urlState.onFiltersChange}
        onExportError={(message) => setFeedback({ type: "error", message })}
      />
      <ApplicationListResults
        loading={loading}
        error={error}
        applications={applications}
        total={total}
        page={page}
        returnTo={urlState.listHref}
        onPageChange={urlState.onPageChange}
        onDetailNavigate={urlState.onDetailNavigate}
        onArchive={targets.setArchiveTarget}
        onDelete={isArchivedView ? targets.setDeleteTarget : undefined}
        onEditEmail={isArchivedView ? undefined : targets.setEmailTarget}
        onResendEmail={isArchivedView ? undefined : targets.setResendTarget}
      />
      <HrApplicationListDialogs
        targets={targets}
        onListChanged={onListChanged}
        onFeedback={setFeedback}
      />
    </main>
  )
}
