"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import { ApplyFormActions } from "@/components/apply/apply-form-actions"
import {
  persistApplyFormDraft,
  useApplyFormDraft,
} from "@/components/apply/use-apply-form-draft"
import { ApplyStepper } from "@/components/apply/stepper"
import {
  applyFormDefaults,
  applySchema,
  hrApplySchema,
  type ApplyFormValues,
  type CommitteeValues,
  type GeneralInfoValues,
  type PrivacyValues,
  type UploadValues,
} from "@/components/apply/apply-schema"
import {
  clearApplyFormDraft,
  loadApplyFormDraft,
  saveApplyFormDraft,
  type ApplyFormDraft,
} from "@/components/apply/apply-form-draft"
import {
  deleteDraftDocument,
  loadAllDraftDocuments,
  saveDraftDocument,
  type DraftDocumentKey,
} from "@/components/apply/apply-form-draft-files"
import { applyMappedServerError } from "@/components/apply/apply-form-server-field"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/shared/section-header"
import { listOpenPositions } from "@/lib/api"
import { submitApplyForm, type ApplyFormSubmitSuccess } from "@/components/apply/apply-form-submit"
import { ApplyFormSteps } from "@/components/apply/apply-form-steps"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import { RecruitmentTrackProvider } from "@/lib/recruitment-track"
import type { RecruitmentTrack } from "@/lib/types/track"
import {
  applyFlowShellClasses,
  hrPageShellClasses,
  glassPanelClasses,
  ghostPillButtonClasses,
} from "@/lib/site/surface"
import { cn } from "@/lib/utils"

type FormStep = 1 | 2 | 3 | 4 | 5 | 6

// The step, which way the slide animates, and what the success step shows all move together.
type Wizard = { step: FormStep; direction: number; success: ApplyFormSubmitSuccess }
type WizardAction =
  | { type: "next" }
  | { type: "back" }
  | { type: "jump"; step: FormStep }
  | { type: "submitted"; success: ApplyFormSubmitSuccess }

const initialWizard: Wizard = {
  step: 1,
  direction: 1,
  success: {
    applicationCode: "",
    applicationType: "position",
    successChoices: { firstCommittee: "", secondCommittee: "", firstTitle: "", secondTitle: "" },
  },
}

function wizardReducer(wizard: Wizard, action: WizardAction): Wizard {
  switch (action.type) {
    case "next":
      return { ...wizard, step: (wizard.step + 1) as FormStep, direction: 1 }
    case "back":
      return { ...wizard, step: (wizard.step - 1) as FormStep, direction: -1 }
    case "jump":
      return { ...wizard, step: action.step }
    case "submitted":
      return { step: 6, direction: 1, success: action.success }
  }
}
type CompletedUploadSession = { fingerprint: string; id: string; expiresAt: string }

const panelShellClasses = `mx-auto w-full min-w-0 max-w-full overflow-x-clip ${glassPanelClasses} px-4 py-8 md:px-8`
const errorClasses = "mt-4 text-sm text-aquamarine"
const slideSpring = { type: "spring" as const, stiffness: 400, damping: 35 }
const slideSnap = { duration: 0 }
const stepVariantsMotion = {
  enter: (direction: number) => ({ x: direction * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -40, opacity: 0 }),
}
const stepVariantsReduced = { enter: { x: 0, opacity: 1 }, center: { x: 0, opacity: 1 }, exit: { x: 0, opacity: 1 } }

function fieldErrors<T extends object>(errors: Record<string, { message?: string }> | undefined): Partial<Record<keyof T, string>> {
  return Object.fromEntries(Object.entries(errors ?? {}).map(([key, error]) => [key, error?.message ?? ""])) as Partial<Record<keyof T, string>>
}

const STEP_FIELD = {
  1: "privacy",
  2: "committee",
  3: "general",
  4: "upload",
  5: "upload",
  6: "upload",
} as const

const draftDocumentKeys: DraftDocumentKey[] = ["resume", "registration"]

type ApplyFormProps = {
  initialPositionId?: string
  mode?: "public" | "hr"
  /** The officer hunt reuses this form with its own seats, slots and endpoints. */
  track?: RecruitmentTrack
}

export function ApplyForm({ initialPositionId, mode = "public", track = "r101" }: ApplyFormProps) {
  return (
    <RecruitmentTrackProvider track={track}>
      <ApplyFormBody initialPositionId={initialPositionId} mode={mode} track={track} />
    </RecruitmentTrackProvider>
  )
}

function ApplyFormBody({ initialPositionId, mode, track }: Required<Omit<ApplyFormProps, "initialPositionId">> & { initialPositionId?: string }) {
  const hrMode = mode === "hr"
  const hunt = track === "officer_hunt"
  // R101 keeps a draft so applicants can come back; HR intake and the hunt start clean.
  const noDraft = hrMode || hunt
  const router = useRouter()
  const reducedMotion = useReducedMotion() ?? false
  const [{ step, direction, success }, dispatch] = useReducer(wizardReducer, initialWizard)
  // Stable: the draft restore effect depends on it.
  const jumpToStep = useCallback((target: FormStep) => dispatch({ type: "jump", step: target }), [])
  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const completedUploadRef = useRef<CompletedUploadSession | null>(null)
  const {
    formState: { errors },
    getValues,
    reset,
    setError,
    setValue,
    trigger,
    watch,
  } = useForm<ApplyFormValues>({
    defaultValues: applyFormDefaults,
    resolver: zodResolver(hrMode ? hrApplySchema : applySchema),
    mode: "onTouched",
  })
  const privacy = watch("privacy")
  const general = watch("general")
  const committee = watch("committee")
  const upload = watch("upload")

  useApplyFormDraft({
    hrMode: noDraft,
    step,
    initialPositionId,
    reset,
    watch,
    getValues,
    setValue,
    onRestoreStep: jumpToStep,
  })

  const updatePrivacy = (patch: Partial<PrivacyValues>) => {
    for (const [key, value] of Object.entries(patch)) setValue(`privacy.${key}` as never, value as never, { shouldDirty: true, shouldTouch: true })
  }
  const updateGeneral = (patch: Partial<GeneralInfoValues>) => {
    for (const [key, value] of Object.entries(patch)) setValue(`general.${key}` as never, value as never, { shouldDirty: true, shouldTouch: true })
  }
  const updateCommittee = (patch: Partial<CommitteeValues>) => {
    for (const [key, value] of Object.entries(patch)) setValue(`committee.${key}` as never, value as never, { shouldDirty: true, shouldTouch: true })
  }
  const updateUpload = (patch: Partial<UploadValues>) => {
    completedUploadRef.current = null
    for (const [key, value] of Object.entries(patch)) setValue(`upload.${key}` as never, value as never, { shouldDirty: true, shouldTouch: true })
    if (!noDraft) {
      for (const key of draftDocumentKeys) {
        if (!(key in patch)) continue
        const file = patch[key]
        if (file instanceof File) void saveDraftDocument(key, file)
        else if (file === null) void deleteDraftDocument(key)
      }
      queueMicrotask(() => persistApplyFormDraft(step, getValues()))
    }
  }

  async function goNext() {
    setServerError("")
    if (!(await trigger(STEP_FIELD[step], { shouldFocus: true }))) return
    dispatch({ type: "next" })
  }

  function goBack() {
    setServerError("")
    dispatch({ type: "back" })
  }

  async function submit() {
    if (submittingRef.current) return
    submittingRef.current = true
    setServerError("")
    setSubmitting(true)
    try {
      if (!(await trigger(undefined, { shouldFocus: true }))) return
      const values = getValues()
      try {
        const result = await submitApplyForm(
          values,
          UST_EMAIL_DOMAIN,
          completedUploadRef,
          hrMode,
          track,
        )
        if (hrMode) {
          router.replace("/admin/hr?notice=added")
          return
        }
        dispatch({ type: "submitted", success: result })
      } catch (error) {
        applyMappedServerError(
          error instanceof Error ? error.message : "Could not submit application.",
          setError,
          jumpToStep,
          setServerError,
          Boolean(values.upload.resume && values.upload.registration),
        )
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const variants = reducedMotion ? stepVariantsReduced : stepVariantsMotion
  const transition = reducedMotion ? slideSnap : slideSpring
  const currentStepErrors = {
    privacy: fieldErrors<PrivacyValues>(errors.privacy as never),
    general: fieldErrors<GeneralInfoValues>(errors.general as never),
    committee: fieldErrors<CommitteeValues>(errors.committee as never),
    upload: fieldErrors<UploadValues>(errors.upload as never),
  }
  const wideStep = step === 2 || step === 5
  const panelWidth = wideStep ? (hrMode ? "max-w-none" : "max-w-6xl") : "max-w-2xl"

  return (
    <main className={hrMode ? hrPageShellClasses : applyFlowShellClasses}>
      <LazyMotion features={domAnimation}>
        <div className="flex min-w-0 flex-col gap-10">
        <SectionHeader
          eyebrow={hrMode ? "// HR INTAKE" : hunt ? "// OFFICER HUNT" : "// RECRUITMENT 101"}
          title={hrMode ? "Add Applicant" : hunt ? "Run for AWS Builders – UST Officer" : "Apply to AWS Builders – UST"}
          titleClassName="max-w-none text-balance"
          subtitle={
            hrMode
              ? "Enter the applicant’s profile, application choices, and documents."
              : hunt
                ? "Lead the next term. Choose the board, director or executive assistant seats you want, in order of preference."
                : "Every member lands on a committee that fits how they like to build, organize, or create."
          }
        />
        <ApplyStepper current={step} hrMode={hrMode} />
        <div className={cn(panelShellClasses, panelWidth)}>
          <div className="relative min-w-0 overflow-x-clip">
            <ApplyFormSteps
              step={step}
              direction={direction}
              variants={variants}
              transition={transition}
              hrMode={hrMode}
              serverError={serverError}
              errorClasses={errorClasses}
              privacy={privacy}
              general={general}
              committee={committee}
              upload={upload}
              updatePrivacy={updatePrivacy}
              updateGeneral={updateGeneral}
              updateCommittee={updateCommittee}
              updateUpload={updateUpload}
              currentStepErrors={currentStepErrors}
              applicationCode={success.applicationCode}
              successApplicationType={success.applicationType}
              successChoices={success.successChoices}
            />
          </div>
          {step !== 6 ? (
            <ApplyFormActions
              step={step}
              hrMode={hrMode}
              submitting={submitting}
              onBack={goBack}
              onNext={goNext}
              onSubmit={submit}
            />
          ) : null}
        </div>
        </div>
      </LazyMotion>
    </main>
  )
}
