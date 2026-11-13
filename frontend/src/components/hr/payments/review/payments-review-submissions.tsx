"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PaymentSubmission } from "@/lib/api/payments"
import { formatDisplayDateTime } from "@/lib/datetime/display"
import { formatPeso } from "@/lib/payments/workspace"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Every attempt, newest first. The reference is the thing an officer checks
// against GCash, so it is large, mono, and one click to copy.
const listClasses = "flex flex-col divide-y divide-blue-chalk/10 border-y border-blue-chalk/10"
const itemClasses = "flex flex-col gap-2 py-4"
const metaClasses = "font-sans text-xs text-prelude"
const referenceRowClasses = "flex min-w-0 items-center gap-2"
const referenceClasses = "min-w-0 break-all font-mono text-lg tabular-nums tracking-wide text-blue-chalk"
const copyClasses =
  "grid size-8 shrink-0 place-items-center rounded-md text-prelude outline-none transition-colors hover:bg-blue-chalk/10 hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/50 pointer-coarse:size-11"
const noteClasses = "font-sans text-sm text-rose-glow"
const receiptClasses = cn("w-fit gap-2 px-4", dashboardActionTargetClasses)

const ATTEMPT_STATUS: Record<PaymentSubmission["status"], string> = {
  pending: "Waiting for review",
  verified: "Verified",
  rejected: "Rejected",
  reversed: "Verification reversed",
}

type CopyState = "idle" | "copied" | "failed"

const COPY_LABELS: Record<CopyState, string> = {
  idle: "Copy reference number",
  copied: "Reference copied",
  failed: "Could not copy the reference",
}

function CopyReference({ value }: { value: string }) {
  const [state, setState] = useState<CopyState>("idle")

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setState("copied")
    } catch {
      // The browser can refuse clipboard access (no permission, or the tab is not focused).
      setState("failed")
    }
    window.setTimeout(() => setState("idle"), 1500)
  }

  return (
    <button type="button" className={copyClasses} aria-label={COPY_LABELS[state]} onClick={() => void copy()}>
      {state === "copied" ? (
        <Check className="size-4" aria-hidden />
      ) : state === "failed" ? (
        <X className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
    </button>
  )
}

type SubmissionsProps = {
  submissions: PaymentSubmission[]
  onReceipt: (submissionId: string) => void
}

export function PaymentsReviewSubmissions({ submissions, onReceipt }: SubmissionsProps) {
  if (submissions.length === 0) return <p className={metaClasses}>No receipt submitted yet.</p>
  const newestFirst = [...submissions].sort((a, b) => b.attemptNumber - a.attemptNumber)

  return (
    <ol className={listClasses} aria-label="Receipt submissions">
      {newestFirst.map((submission) => (
        <li key={submission.id} className={itemClasses}>
          <p className={metaClasses}>
            Attempt {submission.attemptNumber} · {submission.method === "gcash" ? "GCash" : "BPI"} ·{" "}
            {formatPeso(submission.amountCents)} · {ATTEMPT_STATUS[submission.status]}
          </p>
          <div className={referenceRowClasses}>
            <span className={referenceClasses}>{submission.referenceNumber}</span>
            <CopyReference value={submission.referenceNumber} />
          </div>
          <p className={metaClasses}>
            Submitted {formatDisplayDateTime(new Date(submission.submittedAt), { dateStyle: "medium", timeStyle: "short" })}
            {submission.reviewerEmail ? ` · reviewed by ${submission.reviewerEmail}` : ""}
          </p>
          {submission.reviewReason ? <p className={noteClasses}>Reviewer note: {submission.reviewReason}</p> : null}
          <Button type="button" color="purple" size="sm" className={receiptClasses} onClick={() => onReceipt(submission.id)}>
            <ExternalLink className="size-4" aria-hidden />
            View Receipt
          </Button>
        </li>
      ))}
    </ol>
  )
}
