import { ApplicationPagination } from "@/components/hr/applications/application-pagination"
import { ApplicationTable } from "@/components/hr/applications/application-table"
import { ApplicationListSkeleton } from "@/components/hr/applications/application-list-skeleton"
import {
  APPLICATION_TABLE_PAGE_SIZE,
  pageCount,
} from "@/components/hr/applications/application-pagination-utils"
import type { HrApplication } from "@/lib/types/hr-application"

const listClasses = "mt-6 flex min-w-0 flex-col gap-3"
const emptyClasses = "mt-6 font-sans text-sm text-prelude"
const recoveryLinkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"

type ApplicationListResultsProps = {
  loading: boolean
  error: string | null
  applications: HrApplication[]
  total: number
  page: number
  returnTo: string
  onPageChange: (page: number) => void
  onDetailNavigate: () => void
  onArchive: (application: HrApplication) => void
  onDelete?: (application: HrApplication) => void
  onEditEmail?: (application: HrApplication) => void
  onResendEmail?: (application: HrApplication) => void
}

export function ApplicationListResults({
  loading,
  error,
  applications,
  total,
  page,
  returnTo,
  onPageChange,
  onDetailNavigate,
  onArchive,
  onDelete,
  onEditEmail,
  onResendEmail,
}: ApplicationListResultsProps) {
  if (loading) {
    return <ApplicationListSkeleton />
  }
  if (error) {
    return <p className={emptyClasses}>{error}</p>
  }
  const totalPages = pageCount(total, APPLICATION_TABLE_PAGE_SIZE)
  const safePage = Math.min(page, totalPages)

  if (applications.length === 0) {
    if (total === 0) {
      return <p className={emptyClasses}>No applications match those filters.</p>
    }
    return (
      <div className={listClasses}>
        <p className={emptyClasses}>
          That page is no longer available. {" "}
          <button
            type="button"
            className={recoveryLinkClasses}
            onClick={() => onPageChange(safePage)}
          >
            Go to page {safePage}.
          </button>
        </p>
        <ApplicationPagination
          total={total}
          page={safePage}
          onPageChange={onPageChange}
          pageSize={APPLICATION_TABLE_PAGE_SIZE}
        />
      </div>
    )
  }

  return (
    <>
      <ApplicationTable
        applications={applications}
        returnTo={returnTo}
        onNavigate={onDetailNavigate}
        onArchive={onArchive}
        onDelete={onDelete}
        onEditEmail={onEditEmail}
        onResendEmail={onResendEmail}
      />
      <ApplicationPagination
        total={total}
        page={safePage}
        onPageChange={onPageChange}
        pageSize={APPLICATION_TABLE_PAGE_SIZE}
      />
    </>
  )
}
