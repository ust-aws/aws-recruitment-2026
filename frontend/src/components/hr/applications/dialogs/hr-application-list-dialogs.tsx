"use client"

import { useState } from "react"
import { HrArchiveApplicantDialog } from "@/components/hr/applications/dialogs/hr-archive-applicant-dialog"
import { HrDeleteApplicantDialog } from "@/components/hr/applications/dialogs/hr-delete-applicant-dialog"
import { HrEditApplicantEmailDialog } from "@/components/hr/applications/dialogs/hr-edit-applicant-email-dialog"
import { HrResendSuccessEmailDialog } from "@/components/hr/applications/dialogs/hr-resend-success-email-dialog"
import type { HrApplication } from "@/lib/types/hr-application"

export type ListFeedback = { type: "success" | "error"; message: string }

export function useHrListDialogTargets() {
  const [archiveTarget, setArchiveTarget] = useState<HrApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HrApplication | null>(null)
  const [emailTarget, setEmailTarget] = useState<HrApplication | null>(null)
  const [resendTarget, setResendTarget] = useState<HrApplication | null>(null)
  return {
    archiveTarget,
    deleteTarget,
    emailTarget,
    resendTarget,
    setArchiveTarget,
    setDeleteTarget,
    setEmailTarget,
    setResendTarget,
  }
}

type Targets = ReturnType<typeof useHrListDialogTargets>

export function HrApplicationListDialogs({
  targets,
  onListChanged,
  onFeedback,
}: {
  targets: Targets
  onListChanged: (resetPage: boolean) => void
  onFeedback: (feedback: ListFeedback) => void
}) {
  return (
    <>
      <HrArchiveApplicantDialog
        application={targets.archiveTarget}
        onOpenChange={(open) => {
          if (!open) targets.setArchiveTarget(null)
        }}
        onChanged={(updated) => {
          onListChanged(true)
          onFeedback({
            type: "success",
            message: updated.archivedAt
              ? "Applicant archived."
              : "Applicant restored.",
          })
        }}
      />
      <HrDeleteApplicantDialog
        application={targets.deleteTarget}
        onOpenChange={(open) => {
          if (!open) targets.setDeleteTarget(null)
        }}
        onDeleted={() => {
          onListChanged(true)
          onFeedback({
            type: "success",
            message: "Applicant deleted. Their interview slot is now open.",
          })
        }}
      />
      <HrEditApplicantEmailDialog
        application={targets.emailTarget}
        onOpenChange={(open) => {
          if (!open) targets.setEmailTarget(null)
        }}
        onChanged={() => {
          onListChanged(false)
          onFeedback({ type: "success", message: "Applicant email updated." })
        }}
      />
      <HrResendSuccessEmailDialog
        application={targets.resendTarget}
        onOpenChange={(open) => {
          if (!open) targets.setResendTarget(null)
        }}
        onSent={(message) => onFeedback({ type: "success", message })}
      />
    </>
  )
}
