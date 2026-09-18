import { ApplicationPagination } from "@/components/hr/application-pagination"
import { ApplicationRow } from "@/components/hr/application-row"
import { ApplicationListSkeleton } from "@/components/hr/application-list-skeleton"
import { pageCount } from "@/components/hr/application-pagination-utils"
import type { HrApplication } from "@/lib/types/hr-application"

const listClasses = "mt-8 flex min-w-0 flex-col gap-3"
const emptyClasses = "mt-8 font-sans text-sm text-prelude"
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
}: ApplicationListResultsProps) {
  if (loading) {
    return <ApplicationListSkeleton />
  }
  if (error) {
    return <p className={emptyClasses}>{error}</p>
  }
  const totalPages = pageCount(total)
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
        />
      </div>
    )
  }

  return (
    <>
      <ul className={listClasses}>
        {applications.map((application, index) => (
          <li key={application.id}>
            <ApplicationRow
              application={application}
              emphasized={safePage === 1 && index === 0}
              returnTo={returnTo}
              onArchive={onArchive}
              onDelete={onDelete}
              onNavigate={onDetailNavigate}
            />
          </li>
        ))}
      </ul>
      <ApplicationPagination
        total={total}
        page={safePage}
        onPageChange={onPageChange}
      />
    </>
  )
}
