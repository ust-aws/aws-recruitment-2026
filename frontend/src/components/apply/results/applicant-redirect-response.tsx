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
import { respondToRedirect, type ApplicantApplication } from "@/lib/api/applicant"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"

const actionsClasses = "mt-5 flex flex-wrap gap-3"
const errorClasses = "font-sans text-sm text-rose-glow"

type RedirectAnswer = "accepted" | "declined"

type ApplicantRedirectResponseProps = {
  position: string
  committee: string
  /** The offer is an officer hunt seat, not an R101 committee. */
  hunt?: boolean
  onApplicationUpdated: (application: ApplicantApplication) => void
}

function confirmCopy(answer: RedirectAnswer, position: string, committee: string, hunt: boolean) {
  if (answer === "accepted") {
    return {
      title: hunt ? "Accept this seat?" : "Accept this position?",
      body: `You're about to accept ${position} in ${committee}. This is final. You can't change your answer afterward.`,
      confirm: "Yes, accept",
    }
  }
  return {
    title: hunt ? "Decline this seat?" : "Decline this position?",
    body: hunt
      ? "You won't be seated this term, and you can still apply to R101 when it opens. This is final. You can't change your answer afterward."
      : "You'll continue as a general member of AWS Builders - UST. This is final. You can't change your answer afterward.",
    confirm: "Yes, decline",
  }
}

/** Accept or decline buttons for a redirected placement, each behind a final confirmation. */
export function ApplicantRedirectResponse({
  position,
  committee,
  hunt = false,
  onApplicationUpdated,
}: ApplicantRedirectResponseProps) {
  const [answer, setAnswer] = useState<RedirectAnswer | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const copy = answer ? confirmCopy(answer, position, committee, hunt) : null

  async function confirm() {
    if (!answer) return
    setPending(true)
    setError("")
    try {
      onApplicationUpdated(await respondToRedirect(answer))
      setAnswer(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your answer.")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className={actionsClasses}>
        <Button type="button" color="cyan" className={dashboardActionTargetClasses} onClick={() => setAnswer("accepted")}>
          Accept the position
        </Button>
        <Button type="button" color="purple" className={dashboardActionTargetClasses} onClick={() => setAnswer("declined")}>
          Decline
        </Button>
      </div>
      <Dialog
        open={copy !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setAnswer(null)
            setError("")
          }
        }}
      >
        {copy ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.body}</DialogDescription>
            </DialogHeader>
            {error ? <p className={errorClasses} role="alert">{error}</p> : null}
            <DialogFooter>
              <Button type="button" color="purple" disabled={pending} onClick={() => setAnswer(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                color={answer === "accepted" ? "cyan" : "danger"}
                disabled={pending}
                onClick={() => void confirm()}
              >
                {pending ? "Saving…" : copy.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}
