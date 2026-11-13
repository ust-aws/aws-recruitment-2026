"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StatusPill } from "@/components/hr/applications/status-pill"
import { HrArchiveApplicantDialog } from "@/components/hr/applications/dialogs/hr-archive-applicant-dialog"
import { HrDeleteApplicantDialog } from "@/components/hr/applications/dialogs/hr-delete-applicant-dialog"
import { HrEditApplicantEmailDialog } from "@/components/hr/applications/dialogs/hr-edit-applicant-email-dialog"
import { HrResendSuccessEmailDialog } from "@/components/hr/applications/dialogs/hr-resend-success-email-dialog"
import { HrApplicationDetailPanel } from "@/components/hr/applications/detail/hr-application-detail-panel"
import { ActionFeedback } from "@/components/shared/action-feedback"
import type { HrApplication } from "@/lib/types/hr-application"
import {
  displayTitleLeadingClasses,
  glassPanelClasses,
  hrPageShellClasses,
} from "@/lib/site/surface"
import {
  applicantListStatusTag,
  applicationListPlacementLabel,
} from "@/lib/hr/application-display"
import { cn } from "@/lib/utils"

const eyebrowClasses =
  "w-fit font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const backClasses =
  "mb-4 mt-3 inline-flex w-fit items-center gap-1.5 font-mono text-xs text-prelude transition-colors hover:text-blue-chalk"
const headingRowClasses = "flex flex-wrap items-center gap-3"
const titleClasses = `max-w-full font-sans text-4xl font-bold text-balance break-words text-blue-chalk md:text-5xl ${displayTitleLeadingClasses}`
const placementSummaryClasses =
  "mt-2 font-sans text-sm leading-snug text-prelude"
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
  const [emailOpen, setEmailOpen] = useState(false)
  const [resendOpen, setResendOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const canManageEmail = !application.archivedAt
  const listStatusTag = applicantListStatusTag(application)
  const appliedChoiceSummary = applicationListPlacementLabel(application)
  const backLabel = viewingArchive ? "Back to Archive" : "Back to Applications"

  return (
    <main className={cn(hrPageShellClasses, "min-w-0 max-w-full overflow-x-clip")}>
      <p className={eyebrowClasses}>
        {viewingArchive ? "// ARCHIVE" : "// APPLICATIONS"}
      </p>
      <Link href={listHref} className={backClasses}>
        <ArrowLeft className="size-3.5" aria-hidden />
        {backLabel}
      </Link>
      <div className={headingRowClasses}>
        <h2 className={titleClasses}>
          {application.firstName} {application.lastName}
        </h2>
        <StatusPill status={listStatusTag} />
        {viewingArchive ? (
          <span className={archivedPillClasses}>Archived</span>
        ) : null}
      </div>
      {appliedChoiceSummary !== "—" ? (
        <p className={placementSummaryClasses}>{appliedChoiceSummary}</p>
      ) : null}
      {feedback ? (
        <ActionFeedback type={feedback.type} message={feedback.message} />
      ) : null}
      <div className={panelClasses}>
        <HrApplicationDetailPanel
          application={application}
          onUpdated={onUpdated}
          onArchiveClick={() => onArchiveOpenChange(true)}
          onDeleteClick={() => onDeleteOpenChange(true)}
          onEditEmail={canManageEmail ? () => setEmailOpen(true) : undefined}
          onResendSuccessEmail={
            application.canResendSubmittedEmail ? () => setResendOpen(true) : undefined
          }
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
      <HrEditApplicantEmailDialog
        application={emailOpen ? application : null}
        onOpenChange={setEmailOpen}
        onChanged={(updated) => {
          onUpdated(updated)
          setFeedback({
            type: "success",
            message: `Applicant email updated to ${updated.email}.`,
          })
        }}
      />
      <HrResendSuccessEmailDialog
        application={resendOpen ? application : null}
        onOpenChange={setResendOpen}
        onSent={(message) => setFeedback({ type: "success", message })}
      />
    </main>
  )
}
