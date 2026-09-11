"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ActionFeedback } from "@/components/action-feedback"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/hr/status-pill"
import { ChoiceCards } from "@/components/hr/choice-cards"
import { HrApplicationDetailSkeleton } from "@/components/hr/application-detail-skeleton"
import { HrDeleteApplicantDialog } from "@/components/hr/hr-delete-applicant-dialog"
import { HR_DELETE_NOTICE_KEY } from "@/components/hr/application-list"
import {
  formatAppliedDate,
  patchApplicationStatus,
  useApplication,
} from "@/lib/api"
import {
  displayTitleLeadingClasses,
  glassPanelClasses,
  pageShellClasses,
} from "@/lib/surface"
import { deleteOutlineActionClasses } from "@/lib/delete-button-classes"
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
const downloadButtonClasses = "h-10 px-5 text-xs"
const statusRowClasses =
  "mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs uppercase tracking-wide text-prelude"
const statusActionBaseClasses =
  "h-9 rounded-pill border bg-transparent px-5 font-mono text-xs transition-colors"
const approveActionClasses = `${statusActionBaseClasses} border-aquamarine/80 text-aquamarine hover:border-aquamarine hover:bg-aquamarine hover:text-haiti`
const rejectActionClasses = `${statusActionBaseClasses} border-prelude/50 text-prelude hover:border-prelude/80 hover:bg-haiti/80 hover:text-prelude`
const missingClasses = "font-sans text-sm text-prelude"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"

function documentFor(
  application: Application,
  type: ApplicationDocument["documentType"]
) {
  return application.documents.find((doc) => doc.documentType === type)
}

export function HrApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { application, setApplication, loading, error, notFound } =
    useApplication(id)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(
    null
  )
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  const applicationId = application.id
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const resume = documentFor(application, "resume")
  const transcript = documentFor(application, "transcript")
  const registration = documentFor(application, "registration")
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  async function setStatus(status: "approved" | "rejected") {
    setActionError("")
    setActionSuccess("")
    setPendingStatus(status)
    try {
      const updated = await patchApplicationStatus(applicationId, status)
      setApplication(updated)
      setActionSuccess(
        status === "approved" ? "Application approved." : "Application rejected."
      )
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update status."
      )
    } finally {
      setPendingStatus(null)
    }
  }

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
        <p className={whyLabelClasses}>
          Why do you want to join AWS Builders - UST?
        </p>
        <p className={whyBodyClasses}>{application.motivation || "—"}</p>
        <div className={downloadsClasses}>
          <Button color="cyan" className={downloadButtonClasses} disabled={!resume?.s3Key}>
            Download CV ({resume?.fileName ?? "—"})
          </Button>
          <Button
            color="purple"
            className={downloadButtonClasses}
            disabled={!transcript?.s3Key}
          >
            Download TOR ({transcript?.fileName ?? "—"})
          </Button>
          <Button
            color="purple"
            className={downloadButtonClasses}
            disabled={!registration?.s3Key}
          >
            Download RegForm ({registration?.fileName ?? "—"})
          </Button>
        </div>
        <div className={statusRowClasses}>
          <span>Applicant Status:</span>
          <Button
            variant="ghost"
            className={approveActionClasses}
            disabled={pendingStatus !== null}
            onClick={() => setStatus("approved")}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            className={rejectActionClasses}
            disabled={pendingStatus !== null}
            onClick={() => setStatus("rejected")}
          >
            Reject
          </Button>
          <Button
            color="danger"
            className={deleteOutlineActionClasses}
            disabled={pendingStatus !== null}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
        {actionSuccess ? (
          <ActionFeedback type="success" message={actionSuccess} />
        ) : null}
        {actionError ? <ActionFeedback type="error" message={actionError} /> : null}
      </div>
      <HrDeleteApplicantDialog
        application={deleteOpen ? application : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          sessionStorage.setItem(HR_DELETE_NOTICE_KEY, "1")
          router.replace("/admin/hr")
        }}
      />
    </main>
  )
}
