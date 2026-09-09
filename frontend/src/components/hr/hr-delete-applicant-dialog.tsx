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
import { deleteApplication, fullName } from "@/lib/api"
import type { Application } from "@/lib/application-types"

const errorClasses = "text-sm text-rose-glow"

type HrDeleteApplicantDialogProps = {
  application: Application | null
  onOpenChange: (open: boolean) => void
  onDeleted: (id: string) => void
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
      await deleteApplication(application.id)
      onDeleted(application.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete applicant.")
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
          <DialogTitle>Delete applicant?</DialogTitle>
          <DialogDescription>
            {application
              ? `This removes ${fullName(application)} (${application.applicationCode}) from this cycle. They will no longer appear in HR or be able to open their dashboard. This cannot be undone.`
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
          <Button
            color="danger"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
