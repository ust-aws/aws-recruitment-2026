"use client"

import { useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { StatusPill } from "@/components/hr/status-pill"
import { Button } from "@/components/ui/button"
import { patchApplicationDecision } from "@/lib/api"
import type {
  ChoiceDecisionStatus,
  HrApplication,
  UpdateApplicationDecisionInput,
} from "@/lib/hr-application-types"

const panelClasses =
  "mt-8 rounded-[22px] border border-biloba-flower/30 bg-haiti/55 px-5 py-5"
const headerClasses = "font-sans text-lg font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-sm leading-relaxed text-prelude"
const listClasses = "mt-5 grid gap-3"
const rowClasses =
  "flex flex-col gap-3 rounded-[14px] border border-blue-chalk/15 bg-meteorite/35 p-4 md:flex-row md:items-center md:justify-between"
const choiceCopyClasses = "min-w-0"
const rankClasses =
  "font-mono text-[11px] uppercase tracking-wide text-aquamarine"
const choiceClasses = "mt-1 font-sans text-sm font-medium text-blue-chalk"
const actionsClasses = "flex flex-wrap items-center gap-2"
const actionButtonClasses = "h-8 px-4 text-[11px]"
const placementClasses =
  "mt-5 border-t border-blue-chalk/15 pt-5"
const placementButtonsClasses = "mt-3 flex flex-wrap gap-2"
const warningClasses = "mt-3 font-sans text-sm text-rose-glow"

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

  const approvedChoices = application.choices.filter(
    (choice) => choice.decisionStatus === "approved"
  )
  const allDecided = application.choices.every(
    (choice) => choice.decisionStatus !== "pending"
  )

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
    const label = decisionStatus === "approved" ? "approved" : "rejected"
    void save(
      `${positionId}:${decisionStatus}`,
      { positionId, decisionStatus },
      `Committee decision ${label}.`
    )
  }

  return (
    <section className={panelClasses}>
      <h3 className={headerClasses}>Committee decisions</h3>
      <p className={helpClasses}>
        Saving the first decision locks applicant editing. Complete both
        committee decisions, then select the final placement if approved.
      </p>
      <div className={listClasses}>
        {application.choices.map((choice) => (
          <div className={rowClasses} key={choice.positionId}>
            <div className={choiceCopyClasses}>
              <p className={rankClasses}>Choice {choice.preferenceRank}</p>
              <p className={choiceClasses}>
                {choice.committee} · {choice.title}
              </p>
            </div>
            <div className={actionsClasses}>
              <StatusPill status={choice.decisionStatus} />
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
      {approvedChoices.length > 0 ? (
        <div className={placementClasses}>
          <h3 className={headerClasses}>Final placement</h3>
          <div className={placementButtonsClasses}>
            {approvedChoices.map((choice) => (
              <Button
                key={choice.positionId}
                color={
                  application.finalPlacement?.positionId === choice.positionId
                    ? "cyan"
                    : "purple"
                }
                disabled={
                  pending !== null ||
                  application.finalPlacement?.positionId === choice.positionId
                }
                onClick={() =>
                  void save(
                    `placement:${choice.positionId}`,
                    { finalPositionId: choice.positionId },
                    `Final placement set to ${choice.title}.`
                  )
                }
              >
                {pending === `placement:${choice.positionId}`
                  ? "Saving…"
                  : choice.title}
              </Button>
            ))}
          </div>
          {allDecided && !application.finalPlacement ? (
            <p className={warningClasses}>
              Select the final placement to complete this review.
            </p>
          ) : null}
        </div>
      ) : null}
      {feedback ? (
        <ActionFeedback type={feedback.type} message={feedback.message} />
      ) : null}
    </section>
  )
}
