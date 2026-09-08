"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ApplyStepper } from "@/components/apply/stepper"
import { GeneralInfoStep } from "@/components/apply/general-info-step"
import { CommitteeStep } from "@/components/apply/committee-step"
import { UploadStep } from "@/components/apply/upload-step"
import type { CommitteeValues } from "@/components/apply/committee-step"
import type { GeneralInfoValues } from "@/components/apply/general-info-step"
import type { UploadValues } from "@/components/apply/upload-step"
import { SuccessPanel } from "@/components/apply/success-panel"
import {
  clearApplyFormDraft,
  loadApplyFormDraft,
  saveApplyFormDraft,
} from "@/components/apply/apply-form-draft"
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
const stepStageClasses = "relative overflow-hidden"
const actionsClasses = "mt-8 flex items-center justify-between gap-4"
const nextButtonClasses = "h-10 px-5 text-xs"
const errorClasses = "mt-4 text-sm text-aquamarine"

const slideSpring = { type: "spring" as const, stiffness: 400, damping: 35 }
const slideSnap = { duration: 0 }

function stepVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      enter: { x: 0, opacity: 1 },
      center: { x: 0, opacity: 1 },
      exit: { x: 0, opacity: 1 },
    }
  }
  return {
    enter: (direction: number) => ({ x: direction * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction * -40, opacity: 0 }),
  }
}

function persistDraft(
  draftStep: 1 | 2 | 3,
  draftGeneral: GeneralInfoValues,
  draftCommittee: CommitteeValues,
  draftUpload: UploadValues,
) {
  saveApplyFormDraft({
    step: draftStep,
    general: draftGeneral,
    committee: draftCommittee,
    resumeName: draftUpload.resume?.name ?? draftUpload.resumeDisplayName,
    transcriptName:
      draftUpload.transcript?.name ?? draftUpload.transcriptDisplayName,
  })
}

export function ApplyForm() {
  const reducedMotion = useReducedMotion() ?? false
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1)
  const [direction, setDirection] = useState(1)
  const [general, setGeneral] = useState(emptyGeneral)
  const [committee, setCommittee] = useState(emptyCommittee)
  const [upload, setUpload] = useState(emptyUpload)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const draft = loadApplyFormDraft()
      if (draft) {
        setGeneral(draft.general)
        setCommittee(draft.committee)
        setStep(draft.step)
        setUpload({
          resume: null,
          transcript: null,
          resumeDisplayName: draft.resumeName,
          transcriptDisplayName: draft.transcriptName,
        })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

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
    setDirection(1)
    if (step === 1) {
      setStep(2)
      persistDraft(2, general, committee, upload)
    }
    if (step === 2) {
      setStep(3)
      persistDraft(3, general, committee, upload)
    }
  }

  function goBack() {
    setError("")
    setDirection(-1)
    const prevStep = step === 3 ? 2 : 1
    setStep(prevStep)
    persistDraft(prevStep, general, committee, upload)
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
      clearApplyFormDraft()
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

  const variants = stepVariants(reducedMotion)
  const transition = reducedMotion ? slideSnap : slideSpring

  return (
    <main className={pageShellClasses}>
      <LazyMotion features={domAnimation}>
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
        <div className={stepStageClasses}>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 1 ? (
                <GeneralInfoStep
                  values={general}
                  onChange={(patch) => {
                    const next = { ...general, ...patch }
                    setGeneral(next)
                    if (step === 1) persistDraft(1, next, committee, upload)
                  }}
                />
              ) : null}
              {step === 2 ? (
                <CommitteeStep
                  values={committee}
                  onChange={(patch) => {
                    const next = { ...committee, ...patch }
                    setCommittee(next)
                    if (step === 2) persistDraft(2, general, next, upload)
                  }}
                />
              ) : null}
              {step === 3 ? (
                <UploadStep
                  values={upload}
                  onChange={(patch) => {
                    const next = { ...upload, ...patch }
                    setUpload(next)
                    if (step === 3) persistDraft(3, general, committee, next)
                  }}
                />
              ) : null}
              {error ? <p className={errorClasses}>{error}</p> : null}
            </m.div>
          </AnimatePresence>
        </div>
        <div className={actionsClasses}>
          {step === 1 ? (
            <Button
              color="purple"
              className={ghostPillButtonClasses}
              nativeButton={false}
              render={<Link href="/" />}
            >
              ← Back
            </Button>
          ) : (
            <Button
              type="button"
              color="purple"
              className={ghostPillButtonClasses}
              onClick={goBack}
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
            <Button
              type="button"
              color="cyan"
              className={nextButtonClasses}
              onClick={goNext}
            >
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
      </LazyMotion>
    </main>
  )
}
