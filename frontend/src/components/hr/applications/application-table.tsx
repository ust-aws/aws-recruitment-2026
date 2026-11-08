import { ApplicationTableRow } from "@/components/hr/applications/application-table-row"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import type { HrApplication } from "@/lib/types/hr-application"
import { cn } from "@/lib/utils"

const wrapClasses = cn(dashboardPanelClasses, "mt-6 min-w-0 overflow-hidden")
const tableClasses = "w-full border-collapse text-left max-xl:block"
const headClasses = "max-xl:sr-only"
const headCellClasses =
  "border-b border-blue-chalk/15 px-3 py-2.5 font-sans text-xs font-medium text-prelude"

type ApplicationTableProps = {
  applications: HrApplication[]
  returnTo: string
  onNavigate: () => void
  onArchive: (application: HrApplication) => void
  onDelete?: (application: HrApplication) => void
  onEditEmail?: (application: HrApplication) => void
  onResendEmail?: (application: HrApplication) => void
}

export function ApplicationTable({ applications, ...rowProps }: ApplicationTableProps) {
  return (
    <div className={wrapClasses}>
      <table className={tableClasses}>
        <caption className="sr-only">Applications</caption>
        <thead className={headClasses}>
          <tr>
            <th scope="col" className={headCellClasses}>
              <span className="sr-only">Actions</span>
            </th>
            <th scope="col" className={headCellClasses}>
              Code
            </th>
            <th scope="col" className={headCellClasses}>
              Applicant
            </th>
            <th scope="col" className={headCellClasses}>
              Position
            </th>
            <th scope="col" className={cn(headCellClasses, "text-right")}>
              Status
            </th>
          </tr>
        </thead>
        <tbody className="max-xl:block">
          {applications.map((application) => (
            <ApplicationTableRow key={application.id} application={application} {...rowProps} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
