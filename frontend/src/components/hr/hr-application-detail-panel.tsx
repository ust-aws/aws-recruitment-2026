"use client"

import { Button } from "@/components/ui/button"
import { ChoiceCards } from "@/components/hr/choice-cards"
import { HrCommitteeDecisionPanel } from "@/components/hr/hr-committee-decision-panel"
import {
  formatAppliedDate,
} from "@/lib/api"
import type { ApplicationDocument } from "@/lib/application-types"
import type { HrApplication } from "@/lib/hr-application-types"
import { formatApplicantGender } from "@/lib/applicant-gender"
import { formatDateDisplay } from "@/lib/date-local"
import { safeExternalHref } from "@/lib/safe-external-href"
import { HrApplicationDocumentActions } from "@/components/hr/hr-application-document-actions"

const metaGridClasses =
  "grid min-w-0 grid-cols-1 gap-3 font-sans text-sm text-blue-chalk sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3"
const metaItemClasses = "min-w-0"
const metaEmailItemClasses = "min-w-0 sm:col-span-2"
const metaLabelClasses = "mr-2 text-prelude"
const metaValueClasses = "min-w-0 [overflow-wrap:anywhere]"
const whyLabelClasses =
  "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses = "mt-2 font-sans text-sm leading-relaxed text-blue-chalk"
const downloadsClasses =
  "mt-8 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
const archiveRowClasses = "mt-8 flex flex-wrap justify-center gap-3"
const archiveActionClasses = "h-9 rounded-pill px-5 font-mono text-xs"
const archivedNoticeClasses =
  "mt-8 rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm text-blue-chalk"
const membershipNoticeClasses =
  "mt-8 rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm leading-relaxed text-blue-chalk"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"

function documentFor(
  application: HrApplication,
  type: ApplicationDocument["documentType"],
) {
  return application.documents.find((doc) => doc.documentType === type)
}

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
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const resume = documentFor(application, "resume")
  const registration = documentFor(application, "registration")
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  return (
    <>
      <div className={metaGridClasses}>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Application ID:</span>
          <span className={metaValueClasses}>{application.applicationCode}</span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Year & Section:</span>
          <span className={metaValueClasses}>{application.section ?? "—"}</span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Age:</span>
          <span className={metaValueClasses}>{application.age ?? "—"}</span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Birthday:</span>
          <span className={metaValueClasses}>
            {application.birthday
              ? formatDateDisplay(application.birthday, "—")
              : "—"}
          </span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Gender:</span>
          <span className={metaValueClasses}>
            {formatApplicantGender(application.gender)}
          </span>
        </p>
        <p className={metaEmailItemClasses}>
          <span className="block text-prelude">Email:</span>
          <span className={metaValueClasses} title={application.email}>
            {application.email}
          </span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Student No.:</span>
          <span className={metaValueClasses}>
            {application.studentNumber ?? "—"}
          </span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Contact:</span>
          <span className={metaValueClasses}>
            {application.contactNumber ?? "—"}
          </span>
        </p>
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Facebook:</span>
          {facebookHref ? (
            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Profile
            </a>
          ) : (
            <span className={metaValueClasses}>—</span>
          )}
        </p>
        {portfolioHref ? (
          <p className={metaItemClasses}>
            <span className={metaLabelClasses}>Portfolio:</span>
            <a
              href={portfolioHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Google Drive
            </a>
          </p>
        ) : null}
        {githubHref ? (
          <p className={metaItemClasses}>
            <span className={metaLabelClasses}>GitHub:</span>
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Profile
            </a>
          </p>
        ) : null}
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Applied:</span>
          <span className={metaValueClasses}>
            {formatAppliedDate(application.submittedAt)}
          </span>
        </p>
      </div>
      {application.applicationType === "member" ? (
        <p className={membershipNoticeClasses}>
          This Member-only registration is accepted automatically and does not
          need a committee decision or interview. Membership payment opens after
          R101, so do not record a payment yet.
        </p>
      ) : (
        <>
          <ChoiceCards first={first} second={second} />
          {application.archivedAt ? (
            <p className={archivedNoticeClasses}>
              This application is archived. Restore it before changing committee
              decisions.
            </p>
          ) : (
            <HrCommitteeDecisionPanel
              application={application}
              onUpdated={onUpdated}
            />
          )}
        </>
      )}
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
