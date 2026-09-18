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
import { fullName, setApplicationArchived } from "@/lib/api"
import type { HrApplication } from "@/lib/types/hr-application"

const errorClasses = "text-sm text-rose-glow"

type HrArchiveApplicantDialogProps = {
  application: HrApplication | null
  onOpenChange: (open: boolean) => void
  onChanged: (application: HrApplication) => void
}

export function HrArchiveApplicantDialog({
  application,
  onOpenChange,
  onChanged,
}: HrArchiveApplicantDialogProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const restoring = Boolean(application?.archivedAt)

  async function confirm() {
    if (!application) return
    setPending(true)
    setError("")
    try {
      const updated = await setApplicationArchived(application.id, !restoring)
      onChanged(updated)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not ${restoring ? "restore" : "archive"} applicant.`
      )
    } finally {
      setPending(false)
    }
  }

  const action = restoring ? "Restore" : "Archive"

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
          <DialogTitle>{action} applicant?</DialogTitle>
          <DialogDescription>
            {application
              ? restoring
                ? `${fullName(application)} (${application.applicationCode}) will return to active applications.`
                : `${fullName(application)} (${application.applicationCode}) will be hidden from active applications and excluded from results release. You can restore this record later.`
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
            color={restoring ? "cyan" : "danger"}
            disabled={pending}
            onClick={confirm}
          >
            {pending ? (restoring ? "Restoring…" : "Archiving…") : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
