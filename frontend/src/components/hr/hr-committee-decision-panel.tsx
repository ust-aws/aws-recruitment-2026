"use client"

import { useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { StatusPill } from "@/components/hr/status-pill"
import { Button } from "@/components/ui/button"
import { patchApplicationDecision } from "@/lib/api"
import type {
  ChoiceDecisionStatus,
  HrApplication,
  UpdateApplicationDecisionInput,
} from "@/lib/types/hr-application"

const panelClasses =
  "mt-8 min-w-0 overflow-x-clip rounded-[22px] border border-biloba-flower/30 bg-haiti/55 px-4 py-5 sm:px-5"
const headerClasses = "font-sans text-lg font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-sm leading-relaxed text-pretty text-prelude"
const listClasses = "mt-5 grid min-w-0 gap-3"
const rowClasses =
  "flex min-w-0 flex-col gap-4 rounded-[14px] border border-blue-chalk/15 bg-meteorite/35 p-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6"
const choiceCopyClasses = "min-w-0 flex-1"
const rankClasses =
  "font-mono text-[11px] uppercase tracking-wide text-aquamarine"
const committeeClasses =
  "mt-1 font-sans text-sm font-medium text-balance break-words text-blue-chalk"
const positionClasses =
  "mt-0.5 font-sans text-sm leading-snug text-pretty break-words text-prelude"
const actionsClasses =
  "grid w-full min-w-0 shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:items-center xl:justify-end"
const actionButtonClasses = "h-9 w-full min-w-0 px-3 text-xs sm:w-auto sm:px-4"
const statusCellClasses = "col-span-2 sm:col-span-1 sm:w-auto"
const placementClasses =
  "mt-5 border-t border-blue-chalk/15 pt-5 font-sans text-sm text-prelude"

type Props = {
  application: HrApplication
  onUpdated: (application: HrApplication) => void
}

export function HrCommitteeDecisionPanel({
  application,
  onUpdated,
}: Props) {
  const [pending, setPending] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  async function save(
    key: string,
    input: UpdateApplicationDecisionInput,
    message: string
  ) {
    setPending(key)
    setFeedback(null)
    try {
      onUpdated(await patchApplicationDecision(application.id, input))
      setFeedback({ type: "success", message })
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Could not save the decision.",
      })
    } finally {
      setPending(null)
    }
  }

  function decide(
    positionId: string,
    decisionStatus: Exclude<ChoiceDecisionStatus, "pending">
  ) {
    const choice = application.choices.find((item) => item.positionId === positionId)
    const message =
      decisionStatus === "approved"
        ? `Applicant approved for ${choice?.title ?? "this position"}.`
        : "Committee decision rejected."
    void save(`${positionId}:${decisionStatus}`, { positionId, decisionStatus }, message)
  }

  return (
    <section className={panelClasses}>
      <h3 className={headerClasses}>Committee decisions</h3>
      <p className={helpClasses}>
        Saving the first decision locks applicant editing. You may approve only
        one choice—approving sets final placement and marks the applicant
        approved. Approving another choice moves placement. You may reject both.
      </p>
      <div className={listClasses}>
        {application.choices.map((choice) => (
          <div className={rowClasses} key={choice.positionId}>
            <div className={choiceCopyClasses}>
              <p className={rankClasses}>Choice {choice.preferenceRank}</p>
              <p className={committeeClasses}>{choice.committee}</p>
              <p className={positionClasses}>{choice.title}</p>
            </div>
            <div className={actionsClasses}>
              <span className={statusCellClasses}>
                <StatusPill status={choice.decisionStatus} />
              </span>
              <Button
                className={actionButtonClasses}
                disabled={
                  pending !== null || choice.decisionStatus === "approved"
                }
                onClick={() => decide(choice.positionId, "approved")}
              >
                {pending === `${choice.positionId}:approved`
                  ? "Saving…"
                  : "Approve"}
              </Button>
              <Button
                color="purple"
                className={actionButtonClasses}
                disabled={
                  pending !== null || choice.decisionStatus === "rejected"
                }
                onClick={() => decide(choice.positionId, "rejected")}
              >
                {pending === `${choice.positionId}:rejected`
                  ? "Saving…"
                  : "Reject"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {application.finalPlacement ? (
        <div className={placementClasses}>
          <p>
            <span className="font-medium text-blue-chalk">Final placement:</span>{" "}
            {application.finalPlacement.title} ({application.finalPlacement.committee})
          </p>
        </div>
      ) : null}
      {feedback ? (
        <ActionFeedback type={feedback.type} message={feedback.message} />
      ) : null}
    </section>
  )
}
