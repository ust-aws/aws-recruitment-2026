"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/hr/status-pill"
import { ChoiceCards } from "@/components/hr/choice-cards"
import { HrCommitteeDecisionPanel } from "@/components/hr/hr-committee-decision-panel"
import { HrApplicationDetailSkeleton } from "@/components/hr/application-detail-skeleton"
import { HrArchiveApplicantDialog } from "@/components/hr/hr-archive-applicant-dialog"
import {
  formatAppliedDate,
  useApplication,
} from "@/lib/api"
import {
  displayTitleLeadingClasses,
  glassPanelClasses,
  pageShellClasses,
} from "@/lib/surface"
import type { Application, ApplicationDocument } from "@/lib/application-types"
import { formatApplicantGender } from "@/lib/applicant-gender"
import { formatDateDisplay } from "@/lib/date-local"
import { safeExternalHref } from "@/lib/safe-external-href"

const eyebrowClasses =
  "w-fit font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const backClasses =
  "mb-3 mt-3 inline-flex font-mono text-xs text-prelude hover:text-blue-chalk"
const headingRowClasses = "flex flex-wrap items-center gap-3"
const titleClasses = `max-w-[640px] font-sans text-4xl font-bold text-blue-chalk md:text-5xl ${displayTitleLeadingClasses}`
const panelClasses = `${glassPanelClasses} mt-8 px-6 py-8 md:px-10`
const metaRowClasses =
  "flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm text-blue-chalk"
const metaLabelClasses = "mr-2 text-prelude"
const whyLabelClasses =
  "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses = "mt-2 font-sans text-sm leading-relaxed text-blue-chalk"
const downloadsClasses = "mt-8 flex flex-wrap justify-center gap-4"
const archiveRowClasses = "mt-8 flex justify-center"
const archiveActionClasses = "h-9 rounded-pill px-5 font-mono text-xs"
const archivedPillClasses =
  "rounded-pill bg-daisy-bush/55 px-3 py-1 font-mono text-xs text-blue-chalk"
const archivedNoticeClasses =
  "mt-8 rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm text-blue-chalk"
const missingClasses = "font-sans text-sm text-prelude"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"
const documentCardClasses =
  "flex min-w-64 flex-1 flex-col gap-3 rounded-[14px] border border-blue-chalk/20 bg-haiti/35 p-4 text-left"
const documentNameClasses = "font-sans text-sm font-semibold text-blue-chalk"
const documentMetaClasses = "font-sans text-xs text-prelude"
const documentActionsClasses = "flex flex-wrap gap-2"
const documentButtonClasses = "h-9 px-4 text-xs"

function documentFor(
  application: Application,
  type: ApplicationDocument["documentType"]
) {
  return application.documents.find((doc) => doc.documentType === type)
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(bytes < 1_000_000 ? 2 : 1)} MB`
}

function DocumentActions({ applicationId, document }: { applicationId: string; document: ApplicationDocument | undefined }) {
  if (!document) {
    return <p className={missingClasses}>Document metadata is not available.</p>
  }
  const expired = new Date(document.availableUntil) <= new Date()
  const baseUrl = `/api/applications/${applicationId}/documents/${document.documentType}`
  return (
    <div className={documentCardClasses}>
      <p className={documentNameClasses}>{document.fileName}</p>
      <p className={documentMetaClasses}>{formatFileSize(document.fileSizeBytes)}</p>
      <p className={documentMetaClasses}>
        Available until {formatAppliedDate(document.availableUntil)}
      </p>
      <div className={documentActionsClasses}>
        {expired ? (
          <>
            <Button color="cyan" className={documentButtonClasses} disabled>View</Button>
            <Button color="purple" className={documentButtonClasses} disabled>Download</Button>
          </>
        ) : (
          <>
          <Button
            color="cyan"
            className={documentButtonClasses}
            nativeButton={false}
            render={<a href={baseUrl} target="_blank" rel="noopener noreferrer" />}
          >
            View
          </Button>
          <Button
            color="purple"
            className={documentButtonClasses}
            nativeButton={false}
            render={<a href={`${baseUrl}?disposition=attachment`} />}
          >
            Download
          </Button>
          </>
        )}
      </div>
      {expired ? <p className={documentMetaClasses}>This file has expired. The application metadata remains available.</p> : null}
    </div>
  )
}

export function HrApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { application, setApplication, loading, error, notFound } =
    useApplication(id)
  const [archiveOpen, setArchiveOpen] = useState(false)

  if (loading) {
    return <HrApplicationDetailSkeleton />
  }

  if (error) {
    return (
      <main className={pageShellClasses}>
        <Link href="/admin/hr" className={backClasses}>
          ← Back to Applications
        </Link>
        <p className={missingClasses}>{error}</p>
      </main>
    )
  }

  if (notFound || !application) {
    return (
      <main className={pageShellClasses}>
        <Link href="/admin/hr" className={backClasses}>
          ← Back to Applications
        </Link>
        <p className={missingClasses}>That application was not found.</p>
      </main>
    )
  }

  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const resume = documentFor(application, "resume")
  const transcript = documentFor(application, "transcript")
  const registration = documentFor(application, "registration")
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  return (
    <main className={pageShellClasses}>
      <p className={eyebrowClasses}>{"// APPLICATIONS"}</p>
      <Link href="/admin/hr" className={backClasses}>
        ← Back to Applications
      </Link>
      <div className={headingRowClasses}>
        <h2 className={titleClasses}>
          {application.firstName} {application.lastName}
        </h2>
        <StatusPill status={application.status} />
        {application.archivedAt ? (
          <span className={archivedPillClasses}>Archived</span>
        ) : null}
      </div>
      <div className={panelClasses}>
        <div className={metaRowClasses}>
          <p>
            <span className={metaLabelClasses}>Application ID:</span>
            {application.applicationCode}
          </p>
          <p>
            <span className={metaLabelClasses}>Year & Section:</span>
            {application.section ?? "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Age:</span>
            {application.age ?? "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Birthday:</span>
            {application.birthday
              ? formatDateDisplay(application.birthday, "—")
              : "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Gender:</span>
            {formatApplicantGender(application.gender)}
          </p>
          <p>
            <span className={metaLabelClasses}>Email:</span>
            {application.email}
          </p>
          <p>
            <span className={metaLabelClasses}>Student No.:</span>
            {application.studentNumber ?? "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Contact:</span>
            {application.contactNumber ?? "—"}
          </p>
          <p>
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
              "—"
            )}
          </p>
          {portfolioHref ? (
            <p>
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
            <p>
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
          <p>
            <span className={metaLabelClasses}>Applied:</span>
            {formatAppliedDate(application.submittedAt)}
          </p>
        </div>
        <ChoiceCards first={first} second={second} />
        {application.archivedAt ? (
          <p className={archivedNoticeClasses}>
            This application is archived. Restore it before changing committee
            decisions.
          </p>
        ) : (
          <HrCommitteeDecisionPanel
            application={application}
            onUpdated={setApplication}
          />
        )}
        <p className={whyLabelClasses}>
          Why do you want to join AWS Builders - UST?
        </p>
        <p className={whyBodyClasses}>{application.motivation || "—"}</p>
        <div className={downloadsClasses}>
          <DocumentActions applicationId={application.id} document={resume} />
          <DocumentActions applicationId={application.id} document={transcript} />
          <DocumentActions applicationId={application.id} document={registration} />
        </div>
        <div className={archiveRowClasses}>
          <Button
            color={application.archivedAt ? "cyan" : "purple"}
            className={archiveActionClasses}
            onClick={() => setArchiveOpen(true)}
          >
            {application.archivedAt ? "Restore applicant" : "Archive applicant"}
          </Button>
        </div>
      </div>
      <HrArchiveApplicantDialog
        application={archiveOpen ? application : null}
        onOpenChange={setArchiveOpen}
        onChanged={(updated) => {
          router.replace(
            `/admin/hr?notice=${updated.archivedAt ? "archived" : "restored"}`
          )
        }}
      />
    </main>
  )
}
