"use client"

import { type FormEvent, useEffect, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { Button } from "@/components/ui/button"
import { DatetimePicker } from "@/components/ui/datetime-picker"
import { Field } from "@/components/field"
import { patchInterviewWindow } from "@/lib/api"
import type { InterviewWindow } from "@/lib/api-client"
import type { InterviewSeasonBounds } from "@/lib/interview-season"
import { DatetimeFieldsSkeleton } from "@/components/hr/datetime-fields-skeleton"
import { glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const formClasses = "mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(localValue: string) {
  return new Date(localValue).toISOString()
}

function boundsToIso(bounds: InterviewSeasonBounds) {
  if (!bounds) return { startsAt: null, endsAt: null }
  return {
    startsAt: bounds.startsAt.toISOString(),
    endsAt: bounds.endsAt.toISOString(),
  }
}

type HrInterviewWindowProps = {
  seasonBounds: InterviewSeasonBounds
  seasonLoading: boolean
  loadError: string
  onSaved: (payload: InterviewWindow) => void
}

export function HrInterviewWindow({
  seasonBounds,
  seasonLoading,
  loadError,
  onSaved,
}: HrInterviewWindowProps) {
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (seasonLoading) return
    const { startsAt: startIso, endsAt: endIso } = boundsToIso(seasonBounds)
    setStartsAt(toDatetimeLocal(startIso))
    setEndsAt(toDatetimeLocal(endIso))
  }, [seasonBounds, seasonLoading])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setPending(true)
    try {
      const updated = await patchInterviewWindow(toIso(startsAt), toIso(endsAt))
      setStartsAt(toDatetimeLocal(updated.startsAt))
      setEndsAt(toDatetimeLocal(updated.endsAt))
      onSaved(updated)
      setMessage("Interview season saved.")
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save interview season."
      )
    } finally {
      setPending(false)
    }
  }

  const displayLoadError = loadError && !seasonLoading ? loadError : ""

  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Interview Season
      </h2>
      <p className="mt-1 font-sans text-sm text-prelude">
        Applicant and HR interview grids only show weeks inside these dates.
      </p>
      {seasonLoading ? (
        <DatetimeFieldsSkeleton />
      ) : (
        <form className={formClasses} onSubmit={onSubmit}>
          <Field label="Starts" htmlFor="interview-start" required>
            <DatetimePicker
              id="interview-start"
              required
              value={startsAt}
              onChange={setStartsAt}
            />
          </Field>
          <Field label="Ends" htmlFor="interview-end" required>
            <DatetimePicker
              id="interview-end"
              required
              value={endsAt}
              onChange={setEndsAt}
            />
          </Field>
          <Button type="submit" color="cyan" disabled={pending}>
            {pending ? "Saving…" : "Save dates"}
          </Button>
        </form>
      )}
      {displayLoadError ? (
        <ActionFeedback type="error" message={displayLoadError} />
      ) : null}
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && message ? (
        <ActionFeedback type="success" message={message} />
      ) : null}
    </section>
  )
}
