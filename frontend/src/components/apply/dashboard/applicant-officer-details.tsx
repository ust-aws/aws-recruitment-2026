"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveOfficerDetails, type ApplicantApplication } from "@/lib/api/applicant"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"

const formClasses = "flex flex-col gap-4"
const rowClasses = "grid grid-cols-1 gap-4 sm:grid-cols-2"
const fieldClasses = "flex flex-col gap-2"
const helpClasses = "font-sans text-xs leading-relaxed text-prelude"
const errorClasses = "font-sans text-sm text-rose-glow"
const successClasses = "font-sans text-sm text-prelude"
const buttonClasses = `w-fit px-5 ${dashboardActionTargetClasses}`

type OfficerDetailsProps = {
  application: ApplicantApplication
  onUpdated: (application: ApplicantApplication) => void
}

/** The two facts printed on an officer's ID card that we do not already have. */
export function ApplicantOfficerDetails({ application, onUpdated }: OfficerDetailsProps) {
  const [studentNumber, setStudentNumber] = useState(application.studentNumber ?? "")
  const [section, setSection] = useState(application.section ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function submit() {
    setError("")
    setSaved(false)
    setPending(true)
    try {
      const details = await saveOfficerDetails({ studentNumber, section })
      onUpdated({ ...application, ...details })
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your details.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className={formClasses}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className={rowClasses}>
        <div className={fieldClasses}>
          <Label htmlFor="officer-student-number">Student number</Label>
          <Input
            id="officer-student-number"
            value={studentNumber}
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
            onChange={(event) => setStudentNumber(event.target.value)}
          />
        </div>
        <div className={fieldClasses}>
          <Label htmlFor="officer-section">Section</Label>
          <Input
            id="officer-section"
            value={section}
            maxLength={4}
            placeholder="e.g. 4CSC"
            autoComplete="off"
            onChange={(event) => setSection(event.target.value)}
          />
        </div>
      </div>
      <p className={helpClasses}>Both are printed on your digital member ID.</p>
      {error ? (
        <p className={errorClasses} role="alert">
          {error}
        </p>
      ) : null}
      {saved ? <p className={successClasses}>Details saved.</p> : null}
      <Button type="submit" color="purple" className={buttonClasses} disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  )
}
