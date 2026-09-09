"use client"

import { type FormEvent, useEffect, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { Button } from "@/components/ui/button"
import { DatetimePicker } from "@/components/ui/datetime-picker"
import { Field } from "@/components/field"
import {
  getRecruitmentWindow,
  patchRecruitmentWindow,
} from "@/lib/api"
import { glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} mt-8 px-5 py-5`
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

export function HrRecruitmentWindow() {
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    getRecruitmentWindow()
      .then((window) => {
        if (cancelled) return
        setStartsAt(toDatetimeLocal(window.startsAt))
        setEndsAt(toDatetimeLocal(window.endsAt))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the recruitment window."
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setPending(true)
    try {
      const updated = await patchRecruitmentWindow(
        toIso(startsAt),
        toIso(endsAt)
      )
      setStartsAt(toDatetimeLocal(updated.startsAt))
      setEndsAt(toDatetimeLocal(updated.endsAt))
      setMessage("Recruitment week saved.")
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save recruitment week."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Recruitment week
      </h2>
      <p className="mt-1 font-sans text-sm text-prelude">
        Applicants can change committees only between these dates.
      </p>
      <form className={formClasses} onSubmit={onSubmit}>
        <Field label="Starts" htmlFor="recruitment-start" required>
          <DatetimePicker
            id="recruitment-start"
            required
            value={startsAt}
            onChange={setStartsAt}
          />
        </Field>
        <Field label="Ends" htmlFor="recruitment-end" required>
          <DatetimePicker
            id="recruitment-end"
            required
            value={endsAt}
            onChange={setEndsAt}
          />
        </Field>
        <Button type="submit" color="cyan" disabled={pending}>
          {pending ? "Saving…" : "Save dates"}
        </Button>
      </form>
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && message ? (
        <ActionFeedback type="success" message={message} />
      ) : null}
    </section>
  )
}
