"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApplicantChoiceCards } from "@/components/apply/applicant-choice-cards"
import { ApplicantChoiceEditor } from "@/components/apply/applicant-choice-editor"
import { ApplicantEditBanner } from "@/components/apply/applicant-edit-banner"
import { ApiError } from "@/lib/api-client"
import {
  getApplicantApplication,
  updateApplicantChoices,
  type ApplicantApplication,
} from "@/lib/applicant-api"
import { glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} mt-8 px-6 py-8 md:px-10`
const headingClasses = "font-sans text-3xl font-bold text-blue-chalk md:text-4xl"
const codeClasses = "mt-2 font-mono text-sm text-aquamarine"
const metaRowClasses =
  "mt-6 flex flex-wrap gap-x-8 gap-y-3 font-sans text-sm text-blue-chalk"
const metaLabelClasses = "mr-2 text-prelude"
const whyLabelClasses = "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses = "mt-2 font-sans text-sm leading-relaxed text-pretty text-justify text-blue-chalk"
const docsClasses = "mt-8 font-sans text-sm text-prelude"
const missingClasses = "mt-8 font-sans text-sm text-prelude"
export function ApplicantDashboard() {
  const router = useRouter()
  const [application, setApplication] = useState<ApplicantApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [pending, setPending] = useState(false)

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
  }) {
    setSaveError("")
    setSaveSuccess("")
    setPending(true)
    try {
      setApplication(await updateApplicantChoices(input))
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

  if (loading) {
    return <p className={missingClasses}>Loading your application…</p>
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

  return (
    <section className={panelClasses}>
      <h1 className={headingClasses}>
        {application.firstName} {application.lastName}
      </h1>
      <p className={codeClasses}>{application.applicationCode}</p>

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
          <span className={metaLabelClasses}>Section</span>
          {application.section ?? "—"}
        </p>
      </div>

      <p className={whyLabelClasses}>Why AWS Builders – UST?</p>
      <p className={whyBodyClasses}>{application.motivation}</p>

      <div className="mt-8">
        <ApplicantChoiceCards first={first} second={second} />
      </div>

      {application.canEdit ? (
        <ApplicantChoiceEditor
          application={application}
          pending={pending}
          error={saveError}
          success={saveSuccess}
          onSave={onSave}
        />
      ) : null}

      <div className={docsClasses}>
        <p>Resume: {resume?.fileName ?? "—"}</p>
        <p className="mt-1">Transcript: {transcript?.fileName ?? "—"}</p>
      </div>
    </section>
  )
}
