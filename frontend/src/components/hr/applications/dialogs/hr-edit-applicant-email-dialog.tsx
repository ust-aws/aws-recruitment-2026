"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { patchApplicantEmail } from "@/lib/api"
import { UST_EMAIL_DOMAIN } from "@/lib/constants"
import type { HrApplication } from "@/lib/types/hr-application"

const errorClasses = "text-sm text-rose-glow"
const fieldClasses = "flex flex-col gap-2"
const emailWrapClasses =
  "flex h-12 items-center overflow-hidden rounded-[20px] bg-haiti/70 focus-within:ring-2 focus-within:ring-aquamarine/30"
const emailInputClasses =
  "h-12 min-h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 py-0 font-sans text-sm leading-normal text-blue-chalk shadow-none placeholder:text-prelude/60 focus-visible:border-0 focus-visible:ring-0"
const emailDomainClasses =
  "flex h-12 shrink-0 items-center border-l border-blue-chalk/20 pl-3 pr-4 font-sans text-sm text-prelude"

function sanitizeEmailLocalInput(value: string): string {
  let local = value.trim()
  const domainLower = UST_EMAIL_DOMAIN.toLowerCase()
  const lower = local.toLowerCase()
  if (lower.endsWith(domainLower)) {
    local = local.slice(0, local.length - UST_EMAIL_DOMAIN.length)
  }
  return local.replace(/@.*$/i, "").trim()
}

type HrEditApplicantEmailDialogProps = {
  application: HrApplication | null
  onOpenChange: (open: boolean) => void
  onChanged: (application: HrApplication) => void
}

type HrEditApplicantEmailFormProps = {
  application: HrApplication
  onOpenChange: (open: boolean) => void
  onChanged: (application: HrApplication) => void
}

function HrEditApplicantEmailForm({
  application,
  onOpenChange,
  onChanged,
}: HrEditApplicantEmailFormProps) {
  const [emailLocal, setEmailLocal] = useState(() =>
    sanitizeEmailLocalInput(application.email),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function confirm() {
    setPending(true)
    setError("")
    try {
      const email = `${emailLocal.trim().toLowerCase()}${UST_EMAIL_DOMAIN}`
      const updated = await patchApplicantEmail(application.id, email)
      onChanged(updated)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update the applicant email.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (pending) return
        if (!open) onOpenChange(false)
      }}
    >
      <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Edit applicant email</DialogTitle>
        <DialogDescription>
          This updates the email stored on the applicant record. Enter the UST
          username before @ust.edu.ph. You can resend the success email
          afterward.
        </DialogDescription>
      </DialogHeader>
      <div className={fieldClasses}>
        <Label htmlFor="applicant-email">Email</Label>
        <div className={emailWrapClasses}>
          <Input
            id="applicant-email"
            type="text"
            autoComplete="off"
            placeholder="juan.delacruz"
            value={emailLocal}
            disabled={pending}
            onChange={(event) =>
              setEmailLocal(sanitizeEmailLocalInput(event.target.value))
            }
            onPaste={(event) => {
              event.preventDefault()
              const pasted = event.clipboardData.getData("text")
              setEmailLocal(sanitizeEmailLocalInput(pasted))
            }}
            className={emailInputClasses}
          />
          <span className={emailDomainClasses}>{UST_EMAIL_DOMAIN}</span>
        </div>
      </div>
      {error ? <p className={errorClasses}>{error}</p> : null}
      <DialogFooter>
        <Button
          color="purple"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button disabled={pending} onClick={() => void confirm()}>
          {pending ? "Saving…" : "Save Email"}
        </Button>
      </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function HrEditApplicantEmailDialog({
  application,
  onOpenChange,
  onChanged,
}: HrEditApplicantEmailDialogProps) {
  if (!application) {
    return null
  }

  return (
    <HrEditApplicantEmailForm
      key={application.id}
      application={application}
      onOpenChange={onOpenChange}
      onChanged={onChanged}
    />
  )
}
