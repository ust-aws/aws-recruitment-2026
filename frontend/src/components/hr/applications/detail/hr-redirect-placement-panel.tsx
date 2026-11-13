"use client"

import { useEffect, useMemo, useState } from "react"
import { CommitteeOfficePicker } from "@/components/apply/form/steps/committee-office-picker"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Field } from "@/components/shared/field"
import { Button } from "@/components/ui/button"
import {
  listPositionApprovalTargets,
  patchApplicationRedirectPlacement,
  type PositionApprovalTarget,
} from "@/lib/api"
import { redirectPlacementLabel } from "@/lib/hr/application-display"
import type { HrApplication } from "@/lib/types/hr-application"
import {
  comparePositionHierarchy,
  groupedCommitteesForPicker,
} from "@/lib/apply/committee-groups"

const panelClasses =
  "mt-8 min-w-0 overflow-x-clip rounded-[22px] border border-biloba-flower/30 bg-haiti/55 px-4 py-5 sm:px-5"
const headerClasses = "font-sans text-lg font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-sm leading-relaxed text-pretty text-prelude"
const editorClasses = "mt-4 flex min-w-0 flex-col gap-4"
const actionsClasses = "flex flex-wrap gap-2"
const waitingClasses = "mt-4 font-sans text-sm text-prelude"
const tagClasses =
  "inline-flex w-fit items-center rounded-pill bg-daisy-bush/70 px-3 py-0.5 font-mono text-[11px] text-blue-chalk"

type Props = {
  application: HrApplication
  onUpdated: (application: HrApplication) => void
}

export function HrRedirectPlacementPanel({ application, onUpdated }: Props) {
  const [positions, setPositions] = useState<PositionApprovalTarget[]>([])
  const [selectedId, setSelectedId] = useState(
    application.redirectPlacement?.positionId ?? "",
  )
  const [pending, setPending] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    setSelectedId(application.redirectPlacement?.positionId ?? "")
  }, [application.redirectPlacement?.positionId])

  useEffect(() => {
    let cancelled = false
    void listPositionApprovalTargets()
      .then((rows) => {
        if (!cancelled) setPositions(rows)
      })
      .catch(() => {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: "Could not load positions for redirect placement.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sortedPositions = useMemo(
    () =>
      [...positions].sort((a, b) =>
        comparePositionHierarchy(
          { committee: a.committee, title: a.title },
          { committee: b.committee, title: b.title },
        ),
      ),
    [positions],
  )

  const pickerPositions = useMemo(
    () =>
      sortedPositions.map((position) => ({
        id: position.id,
        committee: position.committee,
        title: position.title,
        acceptingApplications: true,
      })),
    [sortedPositions],
  )

  const groups = useMemo(() => {
    const committees = [...new Set(sortedPositions.map((position) => position.committee))]
    return groupedCommitteesForPicker(committees)
  }, [sortedPositions])

  const selectedCommittee = useMemo(
    () => sortedPositions.find((position) => position.id === selectedId)?.committee ?? "",
    [selectedId, sortedPositions],
  )

  const tag = redirectPlacementLabel(application)
  const canEditPlacement = !application.redirectResponse
  const awaitingApplicant =
    Boolean(application.redirectPlacement) &&
    Boolean(application.resultsReleasedAt) &&
    !application.redirectResponse

  async function savePlacement(clear: boolean) {
    setPending("placement")
    setFeedback(null)
    try {
      onUpdated(
        await patchApplicationRedirectPlacement(
          application.id,
          clear ? null : selectedId || null,
        ),
      )
      setFeedback({
        type: "success",
        message: clear ? "Redirect placement cleared." : "Redirect placement saved.",
      })
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Could not save redirect placement.",
      })
    } finally {
      setPending(null)
    }
  }

  return (
    <section className={panelClasses} aria-labelledby="redirect-placement-title">
      <div className="flex flex-wrap items-center gap-3">
        <h3 id="redirect-placement-title" className={headerClasses}>
          Redirected placement
        </h3>
        {tag ? <span className={tagClasses}>{tag}</span> : null}
      </div>
      <p className={helpClasses}>
        Offer a committee position outside the applicant&apos;s choices. Results release
        sends the redirected-placement email, and the applicant accepts or declines from
        their dashboard. Saving a redirect un-accepts any approved choice.
      </p>
      {feedback ? (
        <div className="mt-4">
          <ActionFeedback type={feedback.type} message={feedback.message} />
        </div>
      ) : null}
      {canEditPlacement ? (
        <div className={editorClasses}>
          <Field label="Destination position" htmlFor="redirect-destination">
            <CommitteeOfficePicker
              id="redirect-destination"
              committee={selectedCommittee}
              positionId={selectedId}
              groups={groups}
              positions={pickerPositions}
              disabled={Boolean(pending)}
              placeholder="Select redirect destination"
              onSelect={(next) => setSelectedId(next.positionId)}
            />
          </Field>
          <div className={actionsClasses}>
            <Button
              color="cyan"
              className="h-10 shrink-0 rounded-pill px-4 font-mono text-xs"
              disabled={Boolean(pending) || !selectedId}
              onClick={() => void savePlacement(false)}
            >
              Save redirect
            </Button>
            {application.redirectPlacement ? (
              <Button
                color="purple"
                className="h-10 shrink-0 rounded-pill px-4 font-mono text-xs"
                disabled={Boolean(pending)}
                onClick={() => {
                  setSelectedId("")
                  void savePlacement(true)
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      ) : application.redirectPlacement ? (
        <p className="mt-4 font-sans text-sm text-blue-chalk">
          {application.redirectPlacement.committee} —{" "}
          {application.redirectPlacement.title}
        </p>
      ) : null}
      {awaitingApplicant ? (
        <p className={waitingClasses}>
          Waiting for the applicant to accept or decline on their dashboard.
        </p>
      ) : null}
    </section>
  )
}
