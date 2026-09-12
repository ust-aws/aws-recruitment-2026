"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react"
import { ApplyStepper } from "@/components/apply/stepper"
import { PrivacyStep } from "@/components/apply/privacy-step"
import { GeneralInfoStep } from "@/components/apply/general-info-step"
import { CommitteeStep } from "@/components/apply/committee-step"
import { UploadStep } from "@/components/apply/upload-step"
import { ReviewStep } from "@/components/apply/review-step"
import { SuccessPanel } from "@/components/apply/success-panel"
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
} from "@/components/apply/apply-form-draft"
import { mapApplyApiError, toCreateApplicationInput } from "@/components/apply/form-model"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/section-header"
import { createApplication, createUploadSession, listOpenPositions } from "@/lib/api"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import { glassPanelClasses, ghostPillButtonClasses, pageShellClasses } from "@/lib/surface"
import { cn } from "@/lib/utils"

type FormStep = 1 | 2 | 3 | 4 | 5 | 6
type CompletedUploadSession = { fingerprint: string; id: string; expiresAt: string }

const panelShellClasses = `mx-auto mt-10 w-full ${glassPanelClasses} px-4 py-8 md:px-8`
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
const stepVariantsReduced = { enter: { x: 0, opacity: 1 }, center: { x: 0, opacity: 1 }, exit: { x: 0, opacity: 1 } }

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

async function fileChecksum(file: File): Promise<string> {
  return toBase64(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))
}

function fieldErrors<T extends object>(errors: Record<string, { message?: string }> | undefined): Partial<Record<keyof T, string>> {
  return Object.fromEntries(Object.entries(errors ?? {}).map(([key, error]) => [key, error?.message ?? ""])) as Partial<Record<keyof T, string>>
}

type ApplyFormProps = { initialPositionId?: string }

export function ApplyForm({ initialPositionId }: ApplyFormProps) {
  const reducedMotion = useReducedMotion() ?? false
  const [step, setStep] = useState<FormStep>(1)
  const [direction, setDirection] = useState(1)
  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [completedUpload, setCompletedUpload] = useState<CompletedUploadSession | null>(null)
  const [applicationCode, setApplicationCode] = useState("")
  const [successCommittees, setSuccessCommittees] = useState({ first: "", second: "" })
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

  useLayoutEffect(() => {
    const draft = loadApplyFormDraft()
    if (draft) {
      reset({
        privacy: draft.privacy,
        general: draft.general,
        committee: draft.committee,
        upload: { resume: null, transcript: null, registration: null, ...draft.upload },
      })
      setStep(draft.step)
    }
    setDraftReady(true)
  }, [reset])

  useEffect(() => {
    if (!draftReady) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = watch((value) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const current = value as ApplyFormValues
        saveApplyFormDraft({
          step: Math.min(step, 5) as 1 | 2 | 3 | 4 | 5,
          privacy: current.privacy,
          general: current.general,
          committee: current.committee,
          upload: {
            resumeDisplayName: current.upload.resume?.name ?? current.upload.resumeDisplayName,
            transcriptDisplayName: current.upload.transcript?.name ?? current.upload.transcriptDisplayName,
            registrationDisplayName: current.upload.registration?.name ?? current.upload.registrationDisplayName,
          },
        })
      }, 250)
    })
    return () => {
      subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [draftReady, step, watch])

  useEffect(() => {
    if (!draftReady || !initialPositionId) return
    let cancelled = false
    listOpenPositions().then((rows) => {
      const position = rows.find((row) => row.id === initialPositionId)
      if (!cancelled && position) {
        setValue("committee.firstCommittee", position.committee)
        setValue("committee.firstPositionId", position.id)
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
    setCompletedUpload(null)
    for (const [key, value] of Object.entries(patch)) setValue(`upload.${key}` as never, value as never, { shouldDirty: true, shouldTouch: true })
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

  function setMappedServerError(message: string) {
    const lower = message.toLowerCase()
    const set = (name: "privacy.dataPrivacyAgreed" | "general.firstName" | "general.studentNumber" | "general.contactDigits" | "general.facebookUrl" | "general.age" | "general.birthday" | "general.gender" | "general.section" | "general.emailLocal" | "committee.portfolioUrl" | "committee.githubUrl" | "committee.firstPositionId" | "committee.slotId" | "upload.resume", nextStep: FormStep) => {
      setError(name, { type: "server", message })
      setStep(nextStep)
    }
    if (lower.includes("dataprivacy") || lower.includes("data privacy")) return set("privacy.dataPrivacyAgreed", 1)
    if (lower.includes("firstname") || lower.includes("lastname")) return set("general.firstName", 2)
    if (lower.includes("studentnumber")) return set("general.studentNumber", 2)
    if (lower.includes("contactnumber")) return set("general.contactDigits", 2)
    if (lower.includes("facebookurl")) return set("general.facebookUrl", 2)
    if (lower.includes("age")) return set("general.age", 2)
    if (lower.includes("birthday")) return set("general.birthday", 2)
    if (lower.includes("gender")) return set("general.gender", 2)
    if (lower.includes("section")) return set("general.section", 2)
    if (lower.includes("email")) return set("general.emailLocal", 2)
    if (lower.includes("portfolio")) return set("committee.portfolioUrl", 3)
    if (lower.includes("github")) return set("committee.githubUrl", 3)
    if (lower.includes("choice") || lower.includes("position")) return set("committee.firstPositionId", 3)
    if (lower.includes("slot") || lower.includes("interview")) return set("committee.slotId", 3)
    if (lower.includes("document") || lower.includes("resume") || lower.includes("transcript") || lower.includes("registration")) return set("upload.resume", 4)
    setServerError(mapApplyApiError(message))
  }

  async function submit() {
    setServerError("")
    if (!(await trigger(undefined, { shouldFocus: true }))) return
    const values = getValues()
    setSubmitting(true)
    try {
      const files = [
        { documentType: "resume" as const, file: values.upload.resume! },
        { documentType: "transcript" as const, file: values.upload.transcript! },
        { documentType: "registration" as const, file: values.upload.registration! },
      ]
      const documents = await Promise.all(files.map(async ({ documentType, file }) => ({
        documentType, fileName: file.name, sizeBytes: file.size, checksumSha256: await fileChecksum(file),
      })))
      const fingerprint = JSON.stringify(documents)
      let uploadSessionId = completedUpload?.id
      if (!completedUpload || completedUpload.fingerprint !== fingerprint || new Date(completedUpload.expiresAt) <= new Date()) {
        const session = await createUploadSession({ documents })
        await Promise.all(session.uploads.map(async (signedUpload) => {
          const file = files.find((candidate) => candidate.documentType === signedUpload.documentType)!.file
          const form = new FormData()
          Object.entries(signedUpload.fields).forEach(([name, value]) => form.append(name, value))
          form.append("file", file)
          const response = await fetch(signedUpload.url, { method: "POST", body: form })
          if (!response.ok) throw new Error("Could not upload the PDF files.")
        }))
        uploadSessionId = session.uploadSessionId
        setCompletedUpload({ fingerprint, id: session.uploadSessionId, expiresAt: session.sessionExpiresAt })
      }
      const created = await createApplication(toCreateApplicationInput(
        values.privacy, values.general, values.committee, values.upload, UST_EMAIL_DOMAIN, uploadSessionId!,
      ))
      clearApplyFormDraft()
      setApplicationCode(created.applicationCode)
      setSuccessCommittees({
        first: created.choices.find((choice) => choice.preferenceRank === 1)?.committee ?? values.committee.firstCommittee,
        second: created.choices.find((choice) => choice.preferenceRank === 2)?.committee ?? values.committee.secondCommittee,
      })
      setStep(6)
      setDirection(1)
    } catch (error) {
      setMappedServerError(error instanceof Error ? error.message : "Could not submit application.")
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
    <main className={pageShellClasses}>
      <LazyMotion features={domAnimation}>
        <SectionHeader eyebrow="// RECRUITMENT 101" title="Apply to AWS Builders – UST" titleClassName="max-w-none whitespace-nowrap" subtitle="Every member lands on a committee that fits how they like to build, organize, or create." />
        <div className="mt-10"><ApplyStepper current={step} /></div>
        <div className={cn(panelShellClasses, panelWidth)}>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <m.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={transition}>
                {step === 1 ? <PrivacyStep values={privacy} onChange={updatePrivacy} errors={currentStepErrors.privacy} /> : null}
                {step === 2 ? <GeneralInfoStep values={general} onChange={updateGeneral} errors={currentStepErrors.general} /> : null}
                {step === 3 ? <CommitteeStep values={committee} onChange={updateCommittee} errors={currentStepErrors.committee} /> : null}
                {step === 4 ? <UploadStep values={upload} onChange={updateUpload} errors={currentStepErrors.upload} /> : null}
                {step === 5 ? <ReviewStep general={general} committee={committee} upload={upload} onGeneralChange={updateGeneral} onCommitteeChange={updateCommittee} onUploadChange={updateUpload} generalErrors={currentStepErrors.general} committeeErrors={currentStepErrors.committee} uploadErrors={currentStepErrors.upload} /> : null}
                {step === 6 ? <SuccessPanel applicationCode={applicationCode} firstChoiceCommittee={successCommittees.first} secondChoiceCommittee={successCommittees.second} /> : null}
                {serverError ? <p className={errorClasses} role="alert">{serverError}</p> : null}
              </m.div>
            </AnimatePresence>
          </div>
          {step !== 6 ? (
            <div className={actionsClasses}>
              {step === 1 ? <Button color="purple" className={ghostPillButtonClasses} nativeButton={false} render={<Link href="/apply/positions" />}>← Back</Button> : <Button type="button" color="purple" className={ghostPillButtonClasses} onClick={goBack}>← Back</Button>}
              {step === 5 ? <Button type="button" color="cyan" className={nextButtonClasses} onClick={submit} disabled={submitting}>Submit Application</Button> : <Button type="button" color="cyan" className={nextButtonClasses} onClick={goNext}>Next → Step {step + 1}</Button>}
            </div>
          ) : null}
        </div>
      </LazyMotion>
    </main>
  )
}
