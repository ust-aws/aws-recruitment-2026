"use client"

import { type FormEvent, useEffect, useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/shared/field"
import { getRecruitmentWindow, patchRecruitmentWindow } from "@/lib/api"
import {
  recruitmentWeekEndIsoFromYmd,
  recruitmentWeekStartIsoFromYmd,
  recruitmentWeekYmdFromIso,
} from "@/lib/season/recruitment-window"
import { DatetimeFieldsSkeleton } from "@/components/hr/datetime-fields-skeleton"
import { InterviewSeasonDatePicker } from "@/components/hr/interview-season-date-picker"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const formClasses = "mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"

export function HrRecruitmentWindow() {
  const [startYmd, setStartYmd] = useState("")
  const [endYmd, setEndYmd] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getRecruitmentWindow()
      .then((window) => {
        if (cancelled) return
        setStartYmd(recruitmentWeekYmdFromIso(window.startsAt))
        setEndYmd(recruitmentWeekYmdFromIso(window.endsAt))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the recruitment window.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    const startsAt = recruitmentWeekStartIsoFromYmd(startYmd)
    const endsAt = recruitmentWeekEndIsoFromYmd(endYmd)
    if (!startsAt || !endsAt) {
      setError("Choose valid start and end dates.")
      return
    }
    setPending(true)
    try {
      const updated = await patchRecruitmentWindow(startsAt, endsAt)
      setStartYmd(recruitmentWeekYmdFromIso(updated.startsAt))
      setEndYmd(recruitmentWeekYmdFromIso(updated.endsAt))
      setMessage("Recruitment week saved.")
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save recruitment week.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Recruitment Week
      </h2>
      <p className="mt-1 font-sans text-sm text-prelude">
        New applications and applicant dashboard edits are allowed between these
        dates. Times are fixed at 7:00 AM on the start date through 11:59 PM on
        the end date.
      </p>
      {loading ? (
        <DatetimeFieldsSkeleton />
      ) : (
        <form className={formClasses} onSubmit={onSubmit}>
          <Field label="Starts" htmlFor="recruitment-start" required>
            <InterviewSeasonDatePicker
              id="recruitment-start"
              required
              value={startYmd}
              onChange={setStartYmd}
              placeholder="Start date"
            />
          </Field>
          <Field label="Ends" htmlFor="recruitment-end" required>
            <InterviewSeasonDatePicker
              id="recruitment-end"
              required
              value={endYmd}
              onChange={setEndYmd}
              placeholder="End date"
            />
          </Field>
          <Button type="submit" color="cyan" disabled={pending}>
            {pending ? "Saving…" : "Save Dates"}
          </Button>
        </form>
      )}
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && message ? (
        <ActionFeedback type="success" message={message} />
      ) : null}
    </section>
  )
}
