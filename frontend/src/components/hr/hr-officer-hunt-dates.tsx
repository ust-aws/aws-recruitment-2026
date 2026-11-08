"use client"

import { type FormEvent, useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Field } from "@/components/shared/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InterviewSeasonDatePicker } from "@/components/hr/interview-season-date-picker"
import { saveOfficerHuntSettings, type OfficerHuntSettings } from "@/lib/api/officer-hunt"
import {
  interviewSeasonEndIsoFromYmd,
  interviewSeasonStartIsoFromYmd,
  interviewSeasonYmdFromIso,
} from "@/lib/season/interview"
import {
  recruitmentWeekEndIsoFromYmd,
  recruitmentWeekStartIsoFromYmd,
  recruitmentWeekYmdFromIso,
} from "@/lib/season/recruitment-window"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const formClasses = "mt-4 grid gap-4 md:grid-cols-2"
const headingClasses = "font-sans text-lg font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-sm text-prelude"
const submitClasses = "md:col-span-2 md:w-fit"

type DatesProps = {
  settings: OfficerHuntSettings | null
  onSaved: (settings: OfficerHuntSettings) => void
}

/** The term the hunt fills, when people may apply, and when interviews run. */
export function HrOfficerHuntDates({ settings, onSaved }: DatesProps) {
  const [termYear, setTermYear] = useState(settings?.termYear ? String(settings.termYear) : "")
  const [applyStart, setApplyStart] = useState(() => recruitmentWeekYmdFromIso(settings?.applicationsOpenAt ?? null))
  const [applyEnd, setApplyEnd] = useState(() => recruitmentWeekYmdFromIso(settings?.applicationsCloseAt ?? null))
  const [interviewStart, setInterviewStart] = useState(() => interviewSeasonYmdFromIso(settings?.interviewsStartAt ?? null))
  const [interviewEnd, setInterviewEnd] = useState(() => interviewSeasonYmdFromIso(settings?.interviewsEndAt ?? null))
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    const year = Number(termYear)
    if (!Number.isInteger(year) || year < 2000 || year > 9999) {
      setError("Enter the term year, for example 2027.")
      return
    }
    setPending(true)
    try {
      const saved = await saveOfficerHuntSettings({
        termYear: year,
        applicationsOpenAt: applyStart ? recruitmentWeekStartIsoFromYmd(applyStart) : null,
        applicationsCloseAt: applyEnd ? recruitmentWeekEndIsoFromYmd(applyEnd) : null,
        interviewsStartAt: interviewStart ? interviewSeasonStartIsoFromYmd(interviewStart) : null,
        interviewsEndAt: interviewEnd ? interviewSeasonEndIsoFromYmd(interviewEnd) : null,
      })
      onSaved(saved)
      setMessage("Officer hunt dates saved.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the officer hunt dates.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={panelClasses}>
      <h2 className={headingClasses}>Term and Dates</h2>
      <p className={helpClasses}>
        The term year is the year the winners serve; their Member IDs follow it. Applications run 7:00 AM on the
        start date through 11:59 PM on the end date, and interviews from 7:00 AM through 9:30 PM.
      </p>
      <form className={formClasses} onSubmit={onSubmit}>
        <Field label="Term year" htmlFor="hunt-term-year" required>
          <Input
            id="hunt-term-year"
            inputMode="numeric"
            value={termYear}
            onChange={(event) => setTermYear(event.target.value)}
            placeholder="2027"
          />
        </Field>
        <span aria-hidden className="hidden md:block" />
        <Field label="Applications open" htmlFor="hunt-apply-start">
          <InterviewSeasonDatePicker id="hunt-apply-start" value={applyStart} onChange={setApplyStart} placeholder="Start date" />
        </Field>
        <Field label="Applications close" htmlFor="hunt-apply-end">
          <InterviewSeasonDatePicker id="hunt-apply-end" value={applyEnd} onChange={setApplyEnd} placeholder="End date" />
        </Field>
        <Field label="Interviews start" htmlFor="hunt-interview-start">
          <InterviewSeasonDatePicker id="hunt-interview-start" value={interviewStart} onChange={setInterviewStart} placeholder="Start date" />
        </Field>
        <Field label="Interviews end" htmlFor="hunt-interview-end">
          <InterviewSeasonDatePicker id="hunt-interview-end" value={interviewEnd} onChange={setInterviewEnd} placeholder="End date" />
        </Field>
        <Button type="submit" color="cyan" className={submitClasses} disabled={pending}>
          {pending ? "Saving…" : "Save dates"}
        </Button>
      </form>
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && message ? <ActionFeedback type="success" message={message} /> : null}
    </section>
  )
}
