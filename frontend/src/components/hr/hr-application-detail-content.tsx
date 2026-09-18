"use client"

import { useRouter } from "next/navigation"
import { StatusPill } from "@/components/hr/status-pill"
import { HrArchiveApplicantDialog } from "@/components/hr/hr-archive-applicant-dialog"
import { HrDeleteApplicantDialog } from "@/components/hr/hr-delete-applicant-dialog"
import { HrApplicationDetailPanel } from "@/components/hr/hr-application-detail-panel"
import type { HrApplication } from "@/lib/types/hr-application"
import {
  displayTitleLeadingClasses,
  glassPanelClasses,
  pageShellClasses,
} from "@/lib/site/surface"
import { cn } from "@/lib/utils"
import Link from "next/link"

const eyebrowClasses =
  "w-fit font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const backClasses =
  "mb-3 mt-3 inline-flex font-mono text-xs text-prelude hover:text-blue-chalk"
const headingRowClasses = "flex flex-wrap items-center gap-3"
const titleClasses = `max-w-full font-sans text-4xl font-bold text-balance break-words text-blue-chalk md:text-5xl ${displayTitleLeadingClasses}`
const panelClasses = `${glassPanelClasses} mt-8 min-w-0 overflow-x-clip px-4 py-8 sm:px-6 md:px-10`
const archivedPillClasses =
  "rounded-pill bg-daisy-bush/55 px-3 py-1 font-mono text-xs text-blue-chalk"

type HrApplicationDetailContentProps = {
  application: HrApplication
  listHref: string
  viewingArchive: boolean
  archiveOpen: boolean
  deleteOpen: boolean
  onArchiveOpenChange: (open: boolean) => void
  onDeleteOpenChange: (open: boolean) => void
  onUpdated: (application: HrApplication) => void
}

export function HrApplicationDetailContent({
  application,
  listHref,
  viewingArchive,
  archiveOpen,
  deleteOpen,
  onArchiveOpenChange,
  onDeleteOpenChange,
  onUpdated,
}: HrApplicationDetailContentProps) {
  const router = useRouter()
  const backLabel = viewingArchive
    ? "← Back to Archive"
    : "← Back to Applications"

  return (
    <main className={cn(pageShellClasses, "min-w-0 max-w-full overflow-x-clip")}>
      <p className={eyebrowClasses}>
        {viewingArchive ? "// ARCHIVE" : "// APPLICATIONS"}
      </p>
      <Link href={listHref} className={backClasses}>
        {backLabel}
      </Link>
      <div className={headingRowClasses}>
        <h2 className={titleClasses}>
          {application.firstName} {application.lastName}
        </h2>
        <StatusPill status={application.status} />
        {viewingArchive ? (
          <span className={archivedPillClasses}>Archived</span>
        ) : null}
      </div>
      <div className={panelClasses}>
        <HrApplicationDetailPanel
          application={application}
          onUpdated={onUpdated}
          onArchiveClick={() => onArchiveOpenChange(true)}
          onDeleteClick={() => onDeleteOpenChange(true)}
        />
      </div>
      <HrArchiveApplicantDialog
        application={archiveOpen ? application : null}
        onOpenChange={onArchiveOpenChange}
        onChanged={(updated) => {
          router.replace(
            updated.archivedAt
              ? "/admin/hr/archive?notice=archived"
              : "/admin/hr?notice=restored",
          )
        }}
      />
      <HrDeleteApplicantDialog
        application={deleteOpen ? application : null}
        onOpenChange={onDeleteOpenChange}
        onDeleted={() => router.replace("/admin/hr/archive?notice=deleted")}
      />
    </main>
  )
}
