"use client"

import { Button } from "@/components/ui/button"
import type { HrApplication } from "@/lib/types/hr-application"
import { HrApplicationDocumentActions } from "@/components/hr/hr-application-document-actions"
import { HrApplicationCommitteeSection } from "@/components/hr/hr-application-committee-section"
import { HrApplicationMetaGrid } from "@/components/hr/hr-application-meta-grid"
import { hrApplicationDocuments } from "@/lib/hr/application-documents"

const whyLabelClasses =
  "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses = "mt-2 font-sans text-sm leading-relaxed text-blue-chalk"
const downloadsClasses =
  "mt-8 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
const archiveRowClasses = "mt-8 flex flex-wrap justify-center gap-3"
const archiveActionClasses = "h-9 rounded-pill px-5 font-mono text-xs"

type HrApplicationDetailPanelProps = {
  application: HrApplication
  onUpdated: (application: HrApplication) => void
  onArchiveClick: () => void
  onDeleteClick?: () => void
}

export function HrApplicationDetailPanel({
  application,
  onUpdated,
  onArchiveClick,
  onDeleteClick,
}: HrApplicationDetailPanelProps) {
  const { resume, registration } = hrApplicationDocuments(application)

  return (
    <>
      <HrApplicationMetaGrid application={application} />
      <HrApplicationCommitteeSection
        application={application}
        onUpdated={onUpdated}
      />
      <p className={whyLabelClasses}>
        Why do you want to join AWS Builders - UST?
      </p>
      <p className={whyBodyClasses}>{application.motivation || "—"}</p>
      <div className={downloadsClasses}>
        <HrApplicationDocumentActions applicationId={application.id} document={resume} />
        <HrApplicationDocumentActions applicationId={application.id} document={registration} />
      </div>
      <div className={archiveRowClasses}>
        <Button
          color={application.archivedAt ? "cyan" : "danger"}
          className={archiveActionClasses}
          onClick={onArchiveClick}
        >
          {application.archivedAt ? "Restore applicant" : "Archive applicant"}
        </Button>
        {application.archivedAt && onDeleteClick ? (
          <Button
            color="danger"
            className={archiveActionClasses}
            onClick={onDeleteClick}
          >
            Delete permanently
          </Button>
        ) : null}
      </div>
    </>
  )
}
