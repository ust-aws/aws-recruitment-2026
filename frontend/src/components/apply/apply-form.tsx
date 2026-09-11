"use client"



import { useEffect, useLayoutEffect, useState } from "react"

import Link from "next/link"

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"

import { ApplyStepper } from "@/components/apply/stepper"

import { PrivacyStep } from "@/components/apply/privacy-step"

import { GeneralInfoStep } from "@/components/apply/general-info-step"

import { CommitteeStep } from "@/components/apply/committee-step"

import { UploadStep } from "@/components/apply/upload-step"

import type { CommitteeValues } from "@/components/apply/committee-step"

import type { GeneralInfoValues } from "@/components/apply/general-info-step"

import type { PrivacyValues } from "@/components/apply/privacy-step"

import type { UploadValues } from "@/components/apply/upload-step"

import { ReviewStep } from "@/components/apply/review-step"

import { SuccessPanel } from "@/components/apply/success-panel"

import {

  clearApplyFormDraft,

  loadApplyFormDraft,

  saveApplyFormDraft,

} from "@/components/apply/apply-form-draft"

import {

  committeeRequiredFilled,
  committeeStepError,

  committeeValid,

  emptyCommittee,

  emptyGeneral,

  emptyPrivacy,

  emptyUpload,

  generalStepError,

  generalRequiredFilled,
  generalValid,

  mapApplyApiError,

  privacyStepError,

  privacyValid,

  submitBlockedMessage,

  toCreateApplicationInput,

  uploadFileNameError,

  uploadRequiredFilled,

  uploadValid,

} from "@/components/apply/form-model"

import { SectionHeader } from "@/components/section-header"

import { createApplication, listOpenPositions } from "@/lib/api"

import { UST_EMAIL_DOMAIN } from "@/lib/constants"

import {

  glassPanelClasses,

  ghostPillButtonClasses,

  pageShellClasses,

} from "@/lib/surface"

import { cn } from "@/lib/utils"



type FormStep = 1 | 2 | 3 | 4 | 5 | 6



const panelShellClasses = `mx-auto mt-10 w-full ${glassPanelClasses} px-4 py-8 md:px-8`

const panelNarrowClasses = "max-w-2xl"

const panelWideClasses = "max-w-6xl"

const stepStageClasses = "relative overflow-hidden"

const actionsClasses = "mt-8 flex items-center justify-between gap-4"

const nextButtonClasses = "h-10 px-5 text-xs"

const errorClasses = "mt-4 text-sm text-aquamarine"



const slideSpring = { type: "spring" as const, stiffness: 400, damping: 35 }

const slideSnap = { duration: 0 }

const stepVariantsMotion = {
  enter: (direction: number) => ({ x: direction * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -40, opacity: 0 }),
}

const stepVariantsReduced = {
  enter: { x: 0, opacity: 1 },
  center: { x: 0, opacity: 1 },
  exit: { x: 0, opacity: 1 },
}



function persistDraft(

  draftStep: 1 | 2 | 3 | 4 | 5,

  draftPrivacy: PrivacyValues,

  draftGeneral: GeneralInfoValues,

  draftCommittee: CommitteeValues,

  draftUpload: UploadValues,

) {

  saveApplyFormDraft({

    step: draftStep,

    privacy: draftPrivacy,

    general: draftGeneral,

    committee: draftCommittee,

    resumeName: draftUpload.resume?.name ?? draftUpload.resumeDisplayName,

    transcriptName:

      draftUpload.transcript?.name ?? draftUpload.transcriptDisplayName,

    registrationName:

      draftUpload.registration?.name ?? draftUpload.registrationDisplayName,

  })

}



type ApplyFormProps = {

  initialPositionId?: string

}



export function ApplyForm({ initialPositionId }: ApplyFormProps) {

  const reducedMotion = useReducedMotion() ?? false

  const [step, setStep] = useState<FormStep>(1)

  const [direction, setDirection] = useState(1)

  const [privacy, setPrivacy] = useState(emptyPrivacy)

  const [general, setGeneral] = useState(emptyGeneral)

  const [committee, setCommittee] = useState(emptyCommittee)

  const [upload, setUpload] = useState(emptyUpload)

  const [error, setError] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const [applicationCode, setApplicationCode] = useState("")

  const [successCommittees, setSuccessCommittees] = useState({

    first: "",

    second: "",

  })

  const [draftReady, setDraftReady] = useState(false)



  useLayoutEffect(() => {

    const draft = loadApplyFormDraft()

    if (draft) {

      setPrivacy(draft.privacy)

      setGeneral(draft.general)

      setCommittee(draft.committee)

      setStep(draft.step)

      setUpload({

        resume: null,

        transcript: null,

        registration: null,

        resumeDisplayName: draft.resumeName,

        transcriptDisplayName: draft.transcriptName,

        registrationDisplayName: draft.registrationName,

      })

    }

    setDraftReady(true)

  }, [])



  useEffect(() => {

    if (!draftReady || !initialPositionId) return



    let cancelled = false

    listOpenPositions()

      .then((rows) => {

        if (cancelled) return

        const position = rows.find((row) => row.id === initialPositionId)

        if (!position) return

        setCommittee((current) => {

          if (

            current.firstPositionId === position.id &&

            current.firstCommittee === position.committee

          ) {

            return current

          }

          return {

            ...current,

            firstCommittee: position.committee,

            firstPositionId: position.id,

          }

        })

      })

      .catch(() => {})



    return () => {

      cancelled = true

    }

  }, [draftReady, initialPositionId])



  function goNext() {

    setError("")

    if (step === 1 && !privacyValid(privacy)) {

      setError(privacyStepError())

      return

    }

    if (step === 2 && !generalValid(general)) {

      setError(generalStepError(general))

      return

    }

    if (step === 3 && !committeeValid(committee)) {

      setError(committeeStepError(committee))

      return

    }

    setDirection(1)

    if (step === 1) {

      setStep(2)

      persistDraft(2, privacy, general, committee, upload)

    } else if (step === 2) {

      setStep(3)

      persistDraft(3, privacy, general, committee, upload)

    } else if (step === 3) {

      setStep(4)

      persistDraft(4, privacy, general, committee, upload)

    } else if (step === 4) {

      if (!uploadReady) {

        setError(uploadFileNameError())

        return

      }

      setStep(5)

      persistDraft(5, privacy, general, committee, upload)

    }

  }



  function goBack() {

    setError("")

    setDirection(-1)

    if (step === 2) {

      setStep(1)

      persistDraft(1, privacy, general, committee, upload)

    } else if (step === 3) {

      setStep(2)

      persistDraft(2, privacy, general, committee, upload)

    } else if (step === 4) {

      setStep(3)

      persistDraft(3, privacy, general, committee, upload)

    } else if (step === 5) {

      setStep(4)

      persistDraft(4, privacy, general, committee, upload)

    }

  }



  async function submit() {

    setError("")

    const blocked = submitBlockedMessage(privacy, general, committee, upload)

    if (blocked) {

      setError(blocked)

      return

    }

    setSubmitting(true)

    try {

      const created = await createApplication(

        toCreateApplicationInput(

          privacy,

          general,

          committee,

          upload,

          UST_EMAIL_DOMAIN

        )

      )

      clearApplyFormDraft()

      setApplicationCode(created.applicationCode)

      const first = created.choices.find((c) => c.preferenceRank === 1)

      const second = created.choices.find((c) => c.preferenceRank === 2)

      setSuccessCommittees({

        first: first?.committee ?? committee.firstCommittee,

        second: second?.committee ?? committee.secondCommittee,

      })

      setStep(6)
      setDirection(1)

    } catch (err) {

      const message =

        err instanceof Error ? err.message : "Could not submit application."

      setError(mapApplyApiError(message))

    } finally {

      setSubmitting(false)

    }

  }



  const variants = reducedMotion ? stepVariantsReduced : stepVariantsMotion

  const transition = reducedMotion ? slideSnap : slideSpring

  const nextLabel =

    step === 1

      ? "Next → Step 2"

      : step === 2

        ? "Next → Step 3"

        : step === 3

          ? "Next → Step 4"

          : step === 4

            ? "Next → Step 5"

            : ""

  const uploadReady = uploadValid(upload, general.lastName)

  const uploadNameMismatch =
    step === 4 && uploadRequiredFilled(upload) && !uploadReady

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

      <div

        className={cn(

          panelShellClasses,

          step === 3 || step === 5 ? panelWideClasses : panelNarrowClasses

        )}

      >

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

                <PrivacyStep

                  values={privacy}

                  onChange={(patch) => {

                    const next = { ...privacy, ...patch }

                    setPrivacy(next)

                    persistDraft(1, next, general, committee, upload)

                  }}

                />

              ) : null}

              {step === 2 ? (

                <GeneralInfoStep

                  values={general}

                  onChange={(patch) => {

                    const next = { ...general, ...patch }

                    setGeneral(next)

                    persistDraft(2, privacy, next, committee, upload)

                  }}

                />

              ) : null}

              {step === 3 ? (

                <CommitteeStep

                  values={committee}

                  onChange={(patch) => {

                    const next = { ...committee, ...patch }

                    setCommittee(next)

                    persistDraft(3, privacy, general, next, upload)

                  }}

                />

              ) : null}

              {step === 4 ? (

                <UploadStep

                  values={upload}

                  onChange={(patch) => {

                    const next = { ...upload, ...patch }

                    setUpload(next)

                    persistDraft(4, privacy, general, committee, next)

                  }}

                />

              ) : null}

              {step === 5 ? (

                <ReviewStep

                  general={general}

                  committee={committee}

                  upload={upload}

                  onGeneralChange={(patch) => {

                    const next = { ...general, ...patch }

                    setGeneral(next)

                    persistDraft(5, privacy, next, committee, upload)

                  }}

                  onCommitteeChange={(patch) => {

                    const next = { ...committee, ...patch }

                    setCommittee(next)

                    persistDraft(5, privacy, general, next, upload)

                  }}

                  onUploadChange={(patch) => {

                    const next = { ...upload, ...patch }

                    setUpload(next)

                    persistDraft(5, privacy, general, committee, next)

                  }}

                />

              ) : null}

              {step === 6 ? (

                <SuccessPanel

                  applicationCode={applicationCode}

                  firstChoiceCommittee={successCommittees.first}

                  secondChoiceCommittee={successCommittees.second}

                />

              ) : null}

              {uploadNameMismatch ? (
                <p className={errorClasses}>
                  {uploadFileNameError()}
                </p>
              ) : null}

              {error ? <p className={errorClasses}>{error}</p> : null}

            </m.div>

          </AnimatePresence>

        </div>

        {step !== 6 ? (
        <div className={actionsClasses}>

          {step === 1 ? (

            <Button

              color="purple"

              className={ghostPillButtonClasses}

              nativeButton={false}

              render={<Link href="/apply/positions" />}

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

          {step === 5 ? (

            <Button

              type="button"

              color="cyan"

              className={nextButtonClasses}

              onClick={submit}

              disabled={submitting || !uploadReady}

            >

              Submit Application

            </Button>

          ) : (

            <Button

              type="button"

              color="cyan"

              className={nextButtonClasses}

              onClick={goNext}

              disabled={
                (step === 1 && !privacy.dataPrivacyAgreed) ||
                (step === 2 && !generalRequiredFilled(general)) ||
                (step === 3 && !committeeRequiredFilled(committee)) ||
                (step === 4 && (!uploadRequiredFilled(upload) || !uploadReady))
              }

            >

              {nextLabel}

            </Button>

          )}

        </div>
        ) : null}

      </div>

      </LazyMotion>

    </main>

  )

}


