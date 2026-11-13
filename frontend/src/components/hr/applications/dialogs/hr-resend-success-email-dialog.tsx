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
import { resendApplicationSubmittedEmail } from "@/lib/api"
import type { HrApplication } from "@/lib/types/hr-application"

const errorClasses = "text-sm text-rose-glow"

type HrResendSuccessEmailDialogProps = {
  application: HrApplication | null
  onOpenChange: (open: boolean) => void
  onSent: (message: string) => void
}

export function HrResendSuccessEmailDialog({
  application,
  onOpenChange,
  onSent,
}: HrResendSuccessEmailDialogProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function confirm() {
    if (!application) return
    setPending(true)
    setError("")
    try {
      const result = await resendApplicationSubmittedEmail(application.id)
      if (!result.sent) {
        setError(
          `Could not send to ${result.recipient}. Check email delivery settings and try again.`,
        )
        return
      }
      onSent(`Success email sent to ${result.recipient}.`)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend the success email.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={application !== null}
      onOpenChange={(open) => {
        if (pending) return
        if (!open) setError("")
        onOpenChange(open)
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Resend Success Email?</DialogTitle>
          <DialogDescription>
            {application
              ? `This sends the application received email to ${application.email}.`
              : null}
          </DialogDescription>
        </DialogHeader>
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
            {pending ? "Sending…" : "Resend Success Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
