"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ApplyStepper } from "@/components/apply/stepper"
import { GeneralInfoStep } from "@/components/apply/general-info-step"
import { CommitteeStep } from "@/components/apply/committee-step"
import { UploadStep } from "@/components/apply/upload-step"
import { SuccessPanel } from "@/components/apply/success-panel"
import {
  committeeStepError,
  committeeValid,
  emptyCommittee,
  emptyGeneral,
  emptyUpload,
  generalStepError,
  generalValid,
  mapApplyApiError,
  submitBlockedMessage,
  toCreateApplicationInput,
} from "@/components/apply/form-model"
import { SectionHeader } from "@/components/section-header"
import { createApplication } from "@/lib/api"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import {
  glassPanelClasses,
  ghostPillButtonClasses,
  pageShellClasses,
  positionsLinkClasses,
} from "@/lib/surface"

const panelClasses = `mx-auto mt-10 w-full max-w-2xl ${glassPanelClasses} px-6 py-8 md:px-10`
const actionsClasses = "mt-8 flex items-center justify-between gap-4"
const nextButtonClasses = "h-10 px-5 text-xs"
const errorClasses = "mt-4 text-sm text-aquamarine"

export function ApplyForm() {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1)
  const [general, setGeneral] = useState(emptyGeneral)
  const [committee, setCommittee] = useState(emptyCommittee)
  const [upload, setUpload] = useState(emptyUpload)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function goNext() {
    setError("")
    if (step === 1 && !generalValid(general)) {
      setError(generalStepError(general))
      return
    }
    if (step === 2 && !committeeValid(committee)) {
      setError(committeeStepError(committee))
      return
    }
    if (step === 1) setStep(2)
    if (step === 2) setStep(3)
  }

  async function submit() {
    setError("")
    const blocked = submitBlockedMessage(general, committee, upload)
    if (blocked) {
      setError(blocked)
      return
    }
    setSubmitting(true)
    try {
      await createApplication(
        toCreateApplicationInput(general, committee, upload, UST_EMAIL_DOMAIN)
      )
      setStep("success")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not submit application."
      setError(mapApplyApiError(message))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "success") {
    return (
      <main className={pageShellClasses}>
        <SectionHeader
          className="items-center text-center"
          eyebrow="// RECRUITMENT 101"
          title="AWS Builders – UST"
          titleClassName="max-w-none whitespace-nowrap"
        />
        <SuccessPanel />
      </main>
    )
  }

  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// RECRUITMENT 101"
        title="Apply to AWS Builders – UST"
        titleClassName="max-w-none whitespace-nowrap"
        subtitle="Every member lands on a committee that fits how they like to build, organize, or create."
      />
      <div className="mt-10">
        <ApplyStepper current={step} />
      </div>
      <div className={panelClasses}>
        {step === 1 && (
          <GeneralInfoStep
            values={general}
            onChange={(patch) => setGeneral((current) => ({ ...current, ...patch }))}
          />
        )}
        {step === 2 && (
          <CommitteeStep
            values={committee}
            onChange={(patch) => setCommittee((current) => ({ ...current, ...patch }))}
          />
        )}
        {step === 3 && (
          <UploadStep
            values={upload}
            onChange={(patch) => setUpload((current) => ({ ...current, ...patch }))}
          />
        )}
        {error ? <p className={errorClasses}>{error}</p> : null}
        <div className={actionsClasses}>
          {step === 1 ? (
            <Button color="purple" className={ghostPillButtonClasses} nativeButton={false} render={<Link href="/" />}>
              ← Back
            </Button>
          ) : (
            <Button
              type="button"
              color="purple"
              className={ghostPillButtonClasses}
              onClick={() => {
                setError("")
                setStep(step === 3 ? 2 : 1)
              }}
            >
              ← Back
            </Button>
          )}
          {step === 3 ? (
            <Button
              type="button"
              color="cyan"
              className={nextButtonClasses}
              onClick={submit}
              disabled={submitting}
            >
              Submit Application
            </Button>
          ) : (
            <Button type="button" color="cyan" className={nextButtonClasses} onClick={goNext}>
              {step === 1 ? "Next → Step 2" : "Next → Step 3"}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-8 text-center">
        <Link href="/apply/positions" className={positionsLinkClasses}>
          View all open positions →
        </Link>
      </p>
    </main>
  )
}
