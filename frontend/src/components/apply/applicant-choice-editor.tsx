"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { groupedCommitteesForPicker } from "@/lib/committee-groups"
import { useOpenPositions } from "@/lib/api"
import {
  getApplicantInterviewSlots,
  type ApplicantApplication,
  type ApplicantInterviewSlot,
} from "@/lib/applicant-api"
import { fieldControlClasses } from "@/lib/surface"

const stackClasses = "mt-6 flex flex-col gap-4"
const triggerClasses = `${fieldControlClasses} justify-between`
const errorClasses = "text-sm text-rose-glow"
const successClasses = "text-sm text-aquamarine"

type ApplicantChoiceEditorProps = {
  application: ApplicantApplication
  pending: boolean
  error: string
  success?: string
  onSave: (input: {
    choices: { positionId: string; preferenceRank: 1 | 2 }[]
    slotId?: string
  }) => void
}

function formatSlot(slot: ApplicantInterviewSlot) {
  return new Date(slot.startsAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function ApplicantChoiceEditor({
  application,
  pending,
  error,
  success = "",
  onSave,
}: ApplicantChoiceEditorProps) {
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const { positions, committees, loading } = useOpenPositions()
  const groups = groupedCommitteesForPicker(committees)

  const [firstCommittee, setFirstCommittee] = useState(first?.committee ?? "")
  const [firstPositionId, setFirstPositionId] = useState(first?.positionId ?? "")
  const [secondCommittee, setSecondCommittee] = useState(second?.committee ?? "")
  const [secondPositionId, setSecondPositionId] = useState(second?.positionId ?? "")
  const [slotId, setSlotId] = useState("")
  const [slots, setSlots] = useState<ApplicantInterviewSlot[]>([])
  const [slotsError, setSlotsError] = useState("")

  const firstPositions = positions.filter((p) => p.committee === firstCommittee)
  const secondPositions = positions.filter((p) => p.committee === secondCommittee)
  const firstSelectedTitle =
    firstPositions.find((position) => position.id === firstPositionId)?.title ??
    application.choices.find((choice) => choice.positionId === firstPositionId)
      ?.title
  const secondSelectedTitle =
    secondPositions.find((position) => position.id === secondPositionId)?.title ??
    application.choices.find((choice) => choice.positionId === secondPositionId)
      ?.title
  const committeeChanged =
    Boolean(first?.committee) && firstCommittee !== first.committee
  const needsSlot = committeeChanged && Boolean(firstPositionId)

  useEffect(() => {
    if (!needsSlot || !firstPositionId) return

    let cancelled = false
    getApplicantInterviewSlots(firstPositionId)
      .then((schedule) => {
        if (cancelled) return
        setSlots(schedule.slots)
        setSlotsError(schedule.lockReason ?? "")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSlots([])
        setSlotsError(
          err instanceof Error ? err.message : "Could not load interview slots."
        )
      })
    return () => {
      cancelled = true
    }
  }, [needsSlot, firstPositionId])

  const canSubmit = useMemo(() => {
    if (!firstPositionId || !secondPositionId) return false
    if (firstPositionId === secondPositionId) return false
    if (needsSlot && !slotId) return false
    return true
  }, [firstPositionId, needsSlot, secondPositionId, slotId])

  return (
    <form
      className={stackClasses}
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          choices: [
            { positionId: firstPositionId, preferenceRank: 1 },
            { positionId: secondPositionId, preferenceRank: 2 },
          ],
          ...(needsSlot && slotId ? { slotId } : {}),
        })
      }}
    >
      <Field label="First choice committee" htmlFor="dash-first-committee">
        <Select
          value={firstCommittee || null}
          disabled={loading}
          onValueChange={(value: string | null) => {
            setFirstCommittee(value ?? "")
            setFirstPositionId("")
            setSlotId("")
            setSlots([])
            setSlotsError("")
          }}
        >
          <SelectTrigger id="dash-first-committee" className={triggerClasses}>
            <SelectValue placeholder="Select a committee" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.office}>
                <SelectLabel>{group.office}</SelectLabel>
                {group.committees.map((committee) => (
                  <SelectItem key={committee} value={committee}>
                    {committee}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="First choice position" htmlFor="dash-first-position">
        <Select
          value={firstPositionId || null}
          disabled={loading || !firstCommittee}
          onValueChange={(value: string | null) => setFirstPositionId(value ?? "")}
        >
          <SelectTrigger id="dash-first-position" className={triggerClasses}>
            <span className="flex flex-1 truncate text-left">
              {firstSelectedTitle ?? "Select a position"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {firstPositions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Second choice committee" htmlFor="dash-second-committee">
        <Select
          value={secondCommittee || null}
          disabled={loading}
          onValueChange={(value: string | null) => {
            setSecondCommittee(value ?? "")
            setSecondPositionId("")
          }}
        >
          <SelectTrigger id="dash-second-committee" className={triggerClasses}>
            <SelectValue placeholder="Select a committee" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.office}>
                <SelectLabel>{group.office}</SelectLabel>
                {group.committees.map((committee) => (
                  <SelectItem key={committee} value={committee}>
                    {committee}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Second choice position" htmlFor="dash-second-position">
        <Select
          value={secondPositionId || null}
          disabled={loading || !secondCommittee}
          onValueChange={(value: string | null) =>
            setSecondPositionId(value ?? "")
          }
        >
          <SelectTrigger id="dash-second-position" className={triggerClasses}>
            <span className="flex flex-1 truncate text-left">
              {secondSelectedTitle ?? "Select a position"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {secondPositions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {needsSlot ? (
        <Field label="Interview slot for new first-choice committee" htmlFor="dash-slot">
          <Select
            value={slotId || null}
            disabled={slots.length === 0}
            onValueChange={(value: string | null) => setSlotId(value ?? "")}
          >
            <SelectTrigger id="dash-slot" className={triggerClasses}>
              <SelectValue placeholder="Select a slot" />
            </SelectTrigger>
            <SelectContent>
              {slots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  {formatSlot(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {error || (needsSlot ? slotsError : "") ? (
        <p className={errorClasses} role="alert">
          {error || slotsError}
        </p>
      ) : success ? (
        <p className={successClasses} role="status">{success}</p>
      ) : null}
      <Button type="submit" color="cyan" disabled={pending || !canSubmit}>
        {pending ? "Saving…" : "Save committee choices"}
      </Button>
    </form>
  )
}
