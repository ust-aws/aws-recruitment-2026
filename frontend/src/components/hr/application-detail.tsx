"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/hr/status-pill"
import { ChoiceCards } from "@/components/hr/choice-cards"
import {
  formatAppliedDate,
  patchApplicationStatus,
  useApplication,
} from "@/lib/api"
import { glassPanelClasses, pageShellClasses } from "@/lib/surface"
import type { Application, ApplicationDocument } from "@/lib/application-types"

const eyebrowClasses =
  "w-fit font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const backClasses =
  "mb-3 mt-3 inline-flex font-mono text-xs text-prelude hover:text-blue-chalk"
const headingRowClasses = "flex flex-wrap items-center gap-3"
const titleClasses =
  "max-w-[640px] font-sans text-4xl font-bold text-blue-chalk md:text-5xl"
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

function documentFor(
  application: Application,
  type: ApplicationDocument["documentType"]
) {
  return application.documents.find((doc) => doc.documentType === type)
}

export function HrApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const { application, setApplication, loading, error, notFound } =
    useApplication(id)
  const [actionError, setActionError] = useState("")
  const [pendingStatus, setPendingStatus] = useState<"approved" | "rejected" | null>(
    null
  )

  if (loading) {
    return (
      <main className={pageShellClasses}>
        <Link href="/admin/hr" className={backClasses}>
          ← Back to Applications
        </Link>
        <p className={missingClasses}>Loading application…</p>
      </main>
    )
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

  async function setStatus(status: "approved" | "rejected") {
    setActionError("")
    setPendingStatus(status)
    try {
      const updated = await patchApplicationStatus(applicationId, status)
      setApplication(updated)
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
            <span className={metaLabelClasses}>Year & Section:</span>
            {application.section ?? "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Age:</span>
            {application.age ?? "—"}
          </p>
          <p>
            <span className={metaLabelClasses}>Email:</span>
            {application.email}
          </p>
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
            Download Resume ({resume?.fileName ?? "—"})
          </Button>
          <Button
            color="purple"
            className={downloadButtonClasses}
            disabled={!transcript?.s3Key}
          >
            Download Transcript ({transcript?.fileName ?? "—"})
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
        </div>
        {actionError ? <p className={missingClasses}>{actionError}</p> : null}
      </div>
    </main>
  )
}
