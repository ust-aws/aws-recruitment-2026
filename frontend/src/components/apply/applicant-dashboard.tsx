"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApplicantChoiceCards } from "@/components/apply/applicant-choice-cards"
import { ApplicantInterviewScheduler } from "@/components/apply/applicant-interview-scheduler"
import { ApplicantResultPanel } from "@/components/apply/applicant-result-panel"
import { formatDateDisplay } from "@/lib/date-local"
import { formatApplicantGender } from "@/lib/applicant-gender"
import { ApplicantChoiceEditor } from "@/components/apply/applicant-choice-editor"
import { ApplicantEditBanner } from "@/components/apply/applicant-edit-banner"
import { ApiError } from "@/lib/api-client"
import {
  getApplicantApplication,
  updateApplicantChoices,
  type ApplicantApplication,
} from "@/lib/applicant-api"
import { ApplicantDashboardSkeleton } from "@/components/apply/applicant-dashboard-skeleton"
import { ApplicantDocumentEditor } from "@/components/apply/applicant-document-editor"
import { glassPanelClasses } from "@/lib/surface"
import { safeExternalHref } from "@/lib/safe-external-href"

const panelClasses = `${glassPanelClasses} mt-8 px-6 py-8 md:px-10`
const headingClasses = "font-sans text-3xl font-bold text-blue-chalk md:text-4xl"
const codeClasses = "mt-2 font-mono text-sm text-aquamarine"
const metaRowClasses =
  "mt-6 flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm text-blue-chalk"
const metaLabelClasses = "mr-2 text-prelude"
const whyLabelClasses = "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses = "mt-2 font-sans text-sm leading-relaxed text-pretty text-justify text-blue-chalk"
const docsClasses = "mt-8 font-sans text-sm text-prelude"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"
const missingClasses = "mt-8 font-sans text-sm text-prelude"
export function ApplicantDashboard() {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicantApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [pending, setPending] = useState(false)
  const [previewPositionId, setPreviewPositionId] = useState<string>()
  const [previewSlotId, setPreviewSlotId] = useState("")

  useEffect(() => {
    let cancelled = false
    getApplicantApplication()
      .then((payload) => {
        if (cancelled) return
        setApplication(payload)
        setError("")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/apply/status")
          return
        }
        setError(
          err instanceof Error ? err.message : "Could not load your application."
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [router])

  async function onSave(input: {
    choices: { positionId: string; preferenceRank: 1 | 2 }[]
    slotId?: string
    portfolioUrl?: string
    githubUrl?: string
  }) {
    setSaveError("")
    setSaveSuccess("")
    setPending(true)
    try {
      setApplication(await updateApplicantChoices(input))
      setPreviewPositionId(undefined)
      setPreviewSlotId("")
      setSaveSuccess("Committee choices saved.")
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/apply/status")
        return
      }
      setSaveError(
        err instanceof Error ? err.message : "Could not update committee choices."
      )
    } finally {
      setPending(false)
    }
  }

  const handlePreviewPositionIdChange = useCallback(
    (positionId: string | undefined) => {
      setPreviewPositionId(positionId)
      setPreviewSlotId("")
    },
    [],
  )

  if (loading) {
    return <ApplicantDashboardSkeleton />
  }

  if (error || !application) {
    return <p className={missingClasses}>{error || "Application not found."}</p>
  }

  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const resume = application.documents.find((doc) => doc.documentType === "resume")
  const transcript = application.documents.find(
    (doc) => doc.documentType === "transcript"
  )
  const registration = application.documents.find(
    (doc) => doc.documentType === "registration"
  )

  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  return (
    <section className={panelClasses}>
      <h1 className={headingClasses}>
        {application.firstName} {application.lastName}
      </h1>
      <p className={codeClasses}>{application.applicationCode}</p>

      {application.result ? (
        <ApplicantResultPanel
          result={application.result}
          choices={application.choices}
        />
      ) : null}

      <div className="mt-6">
        <ApplicantEditBanner
          canEdit={application.canEdit}
          editDeadline={application.editDeadline}
          lockReason={application.lockReason}
        />
      </div>

      <div className={metaRowClasses}>
        <p>
          <span className={metaLabelClasses}>Email</span>
          {application.email}
        </p>
        <p>
          <span className={metaLabelClasses}>Age</span>
          {application.age ?? "—"}
        </p>
        <p>
          <span className={metaLabelClasses}>Birthday</span>
          {application.birthday
            ? formatDateDisplay(application.birthday, "—")
            : "—"}
        </p>
        <p>
          <span className={metaLabelClasses}>Gender</span>
          {formatApplicantGender(application.gender)}
        </p>
        <p>
          <span className={metaLabelClasses}>Section</span>
          {application.section ?? "—"}
        </p>
        <p>
          <span className={metaLabelClasses}>Student no.</span>
          {application.studentNumber ?? "—"}
        </p>
        <p>
          <span className={metaLabelClasses}>Contact</span>
          {application.contactNumber ?? "—"}
        </p>
        <p>
          <span className={metaLabelClasses}>Facebook</span>
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
            <span className={metaLabelClasses}>Portfolio</span>
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
            <span className={metaLabelClasses}>GitHub</span>
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
      </div>

      <p className={whyLabelClasses}>Why AWS Builders – UST?</p>
      <p className={whyBodyClasses}>{application.motivation}</p>

      <div className="mt-8">
        <ApplicantChoiceCards first={first} second={second} />
      </div>

      <ApplicantInterviewScheduler
        key={previewPositionId ?? "current-booking"}
        positionId={previewPositionId}
        previewMode={Boolean(previewPositionId)}
        selectedSlotId={previewPositionId ? previewSlotId : undefined}
        onSelectedSlotIdChange={
          previewPositionId ? setPreviewSlotId : undefined
        }
      />

      {application.canEdit ? (
        <ApplicantChoiceEditor
          application={application}
          pending={pending}
          error={saveError}
          success={saveSuccess}
          slotId={previewSlotId}
          onPreviewPositionIdChange={handlePreviewPositionIdChange}
          onSave={onSave}
        />
      ) : null}

      {application.canEdit ? (
        <ApplicantDocumentEditor
          application={application}
          onUpdated={setApplication}
        />
      ) : (
        <div className={docsClasses}>
          <p>CV: {resume?.fileName ?? "—"}</p>
          <p className="mt-1">TOR: {transcript?.fileName ?? "—"}</p>
          <p className="mt-1">RegForm: {registration?.fileName ?? "—"}</p>
        </div>
      )}
    </section>
  )
}
