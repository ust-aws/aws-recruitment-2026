"use client"

import { useEffect, useState } from "react"
import type {
  UseFormGetValues,
  UseFormReset,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import type { ApplyFormValues } from "@/components/apply/form/apply-schema"
import {
  loadApplyFormDraft,
  saveApplyFormDraft,
  type ApplyFormDraft,
} from "@/components/apply/form/apply-form-draft"
import { loadAllDraftDocuments } from "@/components/apply/form/apply-form-draft-files"
import { listOpenPositions } from "@/lib/api"

export type DraftStep = 1 | 2 | 3 | 4 | 5 | 6

const DRAFT_SAVE_DEBOUNCE_MS = 250

function draftUploadMeta(upload: ApplyFormValues["upload"]): ApplyFormDraft["upload"] {
  return {
    resumeDisplayName: upload.resume?.name ?? upload.resumeDisplayName,
    registrationDisplayName: upload.registration?.name ?? upload.registrationDisplayName,
  }
}

export function persistApplyFormDraft(step: DraftStep, values: ApplyFormValues) {
  if (step > 5) return
  saveApplyFormDraft({
    step: step as ApplyFormDraft["step"],
    privacy: values.privacy,
    general: values.general,
    committee: values.committee,
    upload: draftUploadMeta(values.upload),
  })
}

type DraftOptions = {
  hrMode: boolean
  step: DraftStep
  initialPositionId?: string
  reset: UseFormReset<ApplyFormValues>
  watch: UseFormWatch<ApplyFormValues>
  getValues: UseFormGetValues<ApplyFormValues>
  setValue: UseFormSetValue<ApplyFormValues>
  onRestoreStep: (step: DraftStep) => void
}

/** Restores and persists the public apply draft; returns whether restore finished. */
export function useApplyFormDraft({
  hrMode,
  step,
  initialPositionId,
  reset,
  watch,
  getValues,
  setValue,
  onRestoreStep,
}: DraftOptions) {
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (hrMode) {
      setDraftReady(true)
      return
    }
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
        onRestoreStep(draft.step)
      }
      setDraftReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [hrMode, onRestoreStep, reset])

  useEffect(() => {
    if (hrMode || !draftReady) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = watch(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        persistApplyFormDraft(step, getValues())
      }, DRAFT_SAVE_DEBOUNCE_MS)
    })
    return () => {
      subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [draftReady, getValues, hrMode, step, watch])

  useEffect(() => {
    if (hrMode || !draftReady) return
    persistApplyFormDraft(step, getValues())
  }, [draftReady, getValues, hrMode, step])

  useEffect(() => {
    if (hrMode || !draftReady || !initialPositionId) return
    let cancelled = false
    listOpenPositions()
      .then((rows) => {
        const position = rows.find((row) => row.id === initialPositionId)
        if (cancelled || !position) return
        setValue("committee.applicationType", "position")
        setValue("committee.firstCommittee", position.committee)
        setValue("committee.firstPositionId", position.id)
        setValue("committee.firstPositionTitle", position.title)
        setValue("committee.slotId", "")
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [draftReady, hrMode, initialPositionId, setValue])

  return draftReady
}
