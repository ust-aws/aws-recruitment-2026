"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import { ApplyStepper } from "@/components/apply/stepper"
import {
  applyFormDefaults,
  applySchema,
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
import { SectionHeader } from "@/components/section-header"
import { listOpenPositions } from "@/lib/api"
import { submitApplyForm } from "@/components/apply/apply-form-submit"
import { ApplyFormSteps } from "@/components/apply/apply-form-steps"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import {
  applyFlowShellClasses,
  glassPanelClasses,
  ghostPillButtonClasses,
} from "@/lib/surface"
import { cn } from "@/lib/utils"

type FormStep = 1 | 2 | 3 | 4 | 5 | 6
type CompletedUploadSession = { fingerprint: string; id: string; expiresAt: string }

const panelShellClasses = `mx-auto w-full min-w-0 max-w-full overflow-x-clip ${glassPanelClasses} px-4 py-8 md:px-8`
const actionsClasses =
  "mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
const nextButtonClasses = "h-10 px-5 text-xs"
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

function draftUploadMeta(upload: UploadValues): ApplyFormDraft["upload"] {
  return {
    resumeDisplayName: upload.resume?.name ?? upload.resumeDisplayName,
    registrationDisplayName: upload.registration?.name ?? upload.registrationDisplayName,
  }
}

function persistApplyFormDraft(step: FormStep, values: ApplyFormValues) {
  if (step > 5) return
  saveApplyFormDraft({
    step: step as ApplyFormDraft["step"],
    privacy: values.privacy,
    general: values.general,
    committee: values.committee,
    upload: draftUploadMeta(values.upload),
  })
}

const draftDocumentKeys: DraftDocumentKey[] = ["resume", "registration"]

type ApplyFormProps = { initialPositionId?: string }

export function ApplyForm({ initialPositionId }: ApplyFormProps) {
  const reducedMotion = useReducedMotion() ?? false
  const [step, setStep] = useState<FormStep>(1)
  const [direction, setDirection] = useState(1)
  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const completedUploadRef = useRef<CompletedUploadSession | null>(null)
  const [applicationCode, setApplicationCode] = useState("")
  const [successApplicationType, setSuccessApplicationType] = useState<
    "position" | "member"
  >("position")
  const [successChoices, setSuccessChoices] = useState({
    firstCommittee: "",
    secondCommittee: "",
    firstTitle: "",
    secondTitle: "",
  })
  const [draftReady, setDraftReady] = useState(false)
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
    resolver: zodResolver(applySchema),
    mode: "onTouched",
  })
  const privacy = watch("privacy")
  const general = watch("general")
  const committee = watch("committee")
  const upload = watch("upload")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const draft = loadApplyFormDraft()
      const files = await loadAllDraftDocuments()
      if (cancelled) return
      if (draft) {
        reset({
          privacy: draft.privacy,
          general: draft.general,
          committee: draft.committee,
          upload: {
            resume: files.resume ?? null,
            registration: files.registration ?? null,
            resumeDisplayName: files.resume?.name ?? draft.upload.resumeDisplayName,
            registrationDisplayName: files.registration?.name ?? draft.upload.registrationDisplayName,
          },
        })
        setStep(draft.step)
      }
      setDraftReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [reset])

  useEffect(() => {
    if (!draftReady) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = watch((value) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        persistApplyFormDraft(step, getValues())
      }, 250)
    })
    return () => {
      subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [draftReady, getValues, step, watch])

  useEffect(() => {
    if (!draftReady) return
    persistApplyFormDraft(step, getValues())
  }, [draftReady, getValues, step])

  useEffect(() => {
    if (!draftReady || !initialPositionId) return
    let cancelled = false
    listOpenPositions().then((rows) => {
      const position = rows.find((row) => row.id === initialPositionId)
      if (!cancelled && position) {
        setValue("committee.applicationType", "position")
        setValue("committee.firstCommittee", position.committee)
        setValue("committee.firstPositionId", position.id)
        setValue("committee.firstPositionTitle", position.title)
        setValue("committee.slotId", "")
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [draftReady, initialPositionId, setValue])

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
    for (const key of draftDocumentKeys) {
      if (!(key in patch)) continue
      const file = patch[key]
      if (file instanceof File) void saveDraftDocument(key, file)
      else if (file === null) void deleteDraftDocument(key)
    }
    queueMicrotask(() => persistApplyFormDraft(step, getValues()))
  }

  async function goNext() {
    setServerError("")
    const name = step === 1 ? "privacy" : step === 2 ? "general" : step === 3 ? "committee" : "upload"
    if (!(await trigger(name, { shouldFocus: true }))) return
    setDirection(1)
    setStep((current) => (current + 1) as FormStep)
  }

  function goBack() {
    setServerError("")
    setDirection(-1)
    setStep((current) => (current - 1) as FormStep)
  }

  async function submit() {
    setServerError("")
    if (!(await trigger(undefined, { shouldFocus: true }))) return
    const values = getValues()
    setSubmitting(true)
    try {
      const result = await submitApplyForm(values, UST_EMAIL_DOMAIN, completedUploadRef)
      setApplicationCode(result.applicationCode)
      setSuccessApplicationType(result.applicationType)
      setSuccessChoices(result.successChoices)
      setStep(6)
      setDirection(1)
    } catch (error) {
      applyMappedServerError(
        error instanceof Error ? error.message : "Could not submit application.",
        setError,
        setStep,
        setServerError,
        Boolean(values.upload.resume && values.upload.registration),
      )
    } finally {
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
  const panelWidth = step === 3 || step === 5 ? "max-w-6xl" : "max-w-2xl"

  return (
    <main className={applyFlowShellClasses}>
      <LazyMotion features={domAnimation}>
        <div className="flex min-w-0 flex-col gap-10">
        <SectionHeader
          eyebrow="// RECRUITMENT 101"
          title="Apply to AWS Builders – UST"
          titleClassName="max-w-none text-balance"
          subtitle="Every member lands on a committee that fits how they like to build, organize, or create."
        />
        <ApplyStepper current={step} />
        <div className={cn(panelShellClasses, panelWidth)}>
          <div className="relative min-w-0 overflow-x-clip">
            <ApplyFormSteps
              step={step}
              direction={direction}
              variants={variants}
              transition={transition}
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
              applicationCode={applicationCode}
              successApplicationType={successApplicationType}
              successChoices={successChoices}
            />
          </div>
          {step !== 6 ? (
            <div className={actionsClasses}>
              {step === 1 ? <Button color="purple" className={ghostPillButtonClasses} nativeButton={false} render={<Link href="/apply/positions" />}>← Back</Button> : <Button type="button" color="purple" className={ghostPillButtonClasses} onClick={goBack}>← Back</Button>}
              {step === 5 ? <Button type="button" color="cyan" className={nextButtonClasses} onClick={submit} disabled={submitting}>Submit Application</Button> : <Button type="button" color="cyan" className={nextButtonClasses} onClick={goNext}>Next → Step {step + 1}</Button>}
            </div>
          ) : null}
        </div>
        </div>
      </LazyMotion>
    </main>
  )
}
