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
import { deleteArchivedApplication, fullName } from "@/lib/api"
import type { HrApplication } from "@/lib/types/hr-application"

const errorClasses = "text-sm text-rose-glow"

type HrDeleteApplicantDialogProps = {
  application: HrApplication | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function HrDeleteApplicantDialog({
  application,
  onOpenChange,
  onDeleted,
}: HrDeleteApplicantDialogProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function confirm() {
    if (!application) return
    setPending(true)
    setError("")
    try {
      await deleteArchivedApplication(application.id)
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete applicant."
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
          <DialogTitle>Delete applicant permanently?</DialogTitle>
          <DialogDescription>
            {application
              ? `${fullName(application)} (${application.applicationCode}) will be removed. Their interview slot will be open again and they can apply with the same UST email. This cannot be undone.`
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
          <Button color="danger" disabled={pending} onClick={confirm}>
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
