import Link from "next/link"
import { ApplicationRowActionsMenu } from "@/components/hr/applications/application-row-actions-menu"
import { StatusPill } from "@/components/hr/applications/status-pill"
import { fullName } from "@/lib/api"
import {
  applicantListStatusTag,
  applicationListPlacementLabel,
} from "@/lib/hr/application-display"
import { dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import type { HrApplication } from "@/lib/types/hr-application"
import { cn } from "@/lib/utils"

const rowClasses =
  "relative border-b border-blue-chalk/10 transition-colors last:border-b-0 hover:bg-blue-chalk/5 max-xl:grid max-xl:grid-cols-[2.75rem_minmax(0,1fr)_auto] max-xl:items-center max-xl:gap-x-2 max-xl:px-2 max-xl:py-2"
const cellClasses = cn(dashboardRowTargetClasses, "px-3 py-1.5 align-middle font-sans text-sm text-blue-chalk max-xl:p-0")
const actionsCellClasses = "relative z-10 w-14 px-2 py-1.5 align-middle max-xl:w-auto max-xl:p-0"
const codeCellClasses = cn(cellClasses, "w-36 font-mono text-xs text-prelude max-xl:hidden")
const positionCellClasses = cn(cellClasses, "text-prelude max-xl:hidden")
const statusCellClasses = cn(cellClasses, "w-32 text-right max-xl:w-auto")
const nameLinkClasses =
  "font-semibold text-balance outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-aquamarine/60"
const subLineClasses = "mt-0.5 block truncate font-sans text-xs text-prelude xl:hidden"
const secondChoiceClasses = "block truncate text-xs text-prelude/80"
const archivedClasses = "ml-2 rounded-pill bg-daisy-bush/55 px-2 py-0.5 font-sans text-xs font-normal text-blue-chalk"

type ApplicationTableRowProps = {
  application: HrApplication
  returnTo: string
  onArchive: (application: HrApplication) => void
  onDelete?: (application: HrApplication) => void
  onEditEmail?: (application: HrApplication) => void
  onResendEmail?: (application: HrApplication) => void
  onNavigate: () => void
}

function secondChoiceTitle(application: HrApplication) {
  if (application.applicationType === "member") return null
  if (applicantListStatusTag(application) !== "pending") return null
  return application.choices.find((choice) => choice.preferenceRank === 2)?.title ?? null
}

export function ApplicationTableRow({
  application,
  returnTo,
  onArchive,
  onDelete,
  onEditEmail,
  onResendEmail,
  onNavigate,
}: ApplicationTableRowProps) {
  const placement = applicationListPlacementLabel(application)
  const secondChoice = secondChoiceTitle(application)

  return (
    <tr className={rowClasses}>
      <td className={actionsCellClasses}>
        <ApplicationRowActionsMenu
          application={application}
          onArchive={onArchive}
          onDelete={onDelete}
          onEditEmail={onEditEmail}
          onResendEmail={onResendEmail}
        />
      </td>
      <td className={codeCellClasses}>{application.applicationCode}</td>
      <td className={cellClasses}>
        <Link
          href={`/admin/hr/${application.id}?returnTo=${encodeURIComponent(returnTo)}`}
          className={nameLinkClasses}
          onClick={onNavigate}
        >
          {fullName(application)}
        </Link>
        {application.archivedAt ? <span className={archivedClasses}>Archived</span> : null}
        <span className={subLineClasses}>
          {application.applicationCode} · {placement}
        </span>
      </td>
      <td className={positionCellClasses}>
        <span className="block truncate">{placement}</span>
        {secondChoice ? <span className={secondChoiceClasses}>2nd: {secondChoice}</span> : null}
      </td>
      <td className={statusCellClasses}>
        <StatusPill status={applicantListStatusTag(application)} />
      </td>
    </tr>
  )
}
