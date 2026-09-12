"use client"

import { type FormEvent, useEffect, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/field"
import { patchInterviewWindow } from "@/lib/api"
import type { InterviewWindow } from "@/lib/api-client"
import type { InterviewSeasonBounds } from "@/lib/interview-season"
import {
  interviewSeasonEndIsoFromYmd,
  interviewSeasonStartIsoFromYmd,
  interviewSeasonYmdFromIso,
} from "@/lib/interview-season"
import { DatetimeFieldsSkeleton } from "@/components/hr/datetime-fields-skeleton"
import { InterviewSeasonDatePicker } from "@/components/hr/interview-season-date-picker"
import { glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const formClasses = "mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"

function boundsToYmd(bounds: InterviewSeasonBounds) {
  if (!bounds) return { startYmd: "", endYmd: "" }
  return {
    startYmd: interviewSeasonYmdFromIso(bounds.startsAt.toISOString()),
    endYmd: interviewSeasonYmdFromIso(bounds.endsAt.toISOString()),
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
  const [startYmd, setStartYmd] = useState("")
  const [endYmd, setEndYmd] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (seasonLoading) return
    const { startYmd: nextStart, endYmd: nextEnd } = boundsToYmd(seasonBounds)
    setStartYmd(nextStart)
    setEndYmd(nextEnd)
  }, [seasonBounds, seasonLoading])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    const startsAt = interviewSeasonStartIsoFromYmd(startYmd)
    const endsAt = interviewSeasonEndIsoFromYmd(endYmd)
    if (!startsAt || !endsAt) {
      setError("Choose valid start and end dates.")
      return
    }
    setPending(true)
    try {
      const updated = await patchInterviewWindow(startsAt, endsAt)
      setStartYmd(interviewSeasonYmdFromIso(updated.startsAt))
      setEndYmd(interviewSeasonYmdFromIso(updated.endsAt))
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
        Times are fixed at 7:00 AM on the start date through 9:30 PM on the end
        date.
      </p>
      {seasonLoading ? (
        <DatetimeFieldsSkeleton />
      ) : (
        <form className={formClasses} onSubmit={onSubmit}>
          <Field label="Starts" htmlFor="interview-start" required>
            <InterviewSeasonDatePicker
              id="interview-start"
              required
              value={startYmd}
              onChange={setStartYmd}
              placeholder="Start date"
            />
          </Field>
          <Field label="Ends" htmlFor="interview-end" required>
            <InterviewSeasonDatePicker
              id="interview-end"
              required
              value={endYmd}
              onChange={setEndYmd}
              placeholder="End date"
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
