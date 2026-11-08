"use client"

import { useEffect, useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { HrPositionApprovalTargetRow } from "@/components/hr/committees/hr-position-approval-target-row"
import {
  listPositionApprovalTargets,
  patchPositionApprovalTarget,
  type PositionApprovalTarget,
} from "@/lib/api"
import {
  COMMITTEE_OFFICE_GROUPS,
  comparePositionHierarchy,
  officeForCommittee,
} from "@/lib/apply/committee-groups"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const listClasses = "mt-4 flex flex-col gap-3"
const loadingClasses = "mt-4 font-sans text-sm text-prelude"
const emptyClasses = "mt-4 font-sans text-sm text-prelude"

function groupPositionsByOffice(positions: PositionApprovalTarget[]) {
  const byOffice = new Map<string, PositionApprovalTarget[]>()
  for (const position of positions) {
    const office = officeForCommittee(position.committee) || "Other"
    const bucket = byOffice.get(office)
    if (bucket) bucket.push(position)
    else byOffice.set(office, [position])
  }
  const orderedOffices = [
    ...COMMITTEE_OFFICE_GROUPS.map((group) => group.office),
    "Other",
  ]
  const groups = []
  for (const office of orderedOffices) {
    const positions = byOffice.get(office)
    if (positions) groups.push({ office, positions })
  }
  return groups
}

type HrPositionApprovalTargetsProps = {
  officeFilter: string
}

export function HrPositionApprovalTargets({
  officeFilter,
}: HrPositionApprovalTargetsProps) {
  const [positions, setPositions] = useState<PositionApprovalTarget[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    listPositionApprovalTargets()
      .then((rows) => {
        if (cancelled) return
        setPositions([...rows].sort(comparePositionHierarchy))
        setDrafts(
          Object.fromEntries(rows.map((row) => [row.id, String(row.openSlots)])),
        )
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load approval targets.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function saveTarget(position: PositionApprovalTarget) {
    const openSlots = Number(drafts[position.id])
    setError("")
    setMessage("")
    if (!Number.isInteger(openSlots) || openSlots < 0) {
      setError("Applicants wanted must be a whole number of 0 or more.")
      return
    }
    setPendingId(position.id)
    try {
      const updated = await patchPositionApprovalTarget(position.id, openSlots)
      setPositions((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      )
      setDrafts((current) => ({
        ...current,
        [updated.id]: String(updated.openSlots),
      }))
      setMessage(`${updated.title} target saved.`)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save approval target.",
      )
    } finally {
      setPendingId(null)
    }
  }

  const officeGroup = groupPositionsByOffice(positions).find(
    (group) => group.office === officeFilter,
  )

  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Approval Targets
      </h2>
      <p className="mt-1 font-sans text-sm text-prelude">
        Set how many applicants HR plans to approve for each position. A
        target of 0 hides the role from applicants and means you are not
        recruiting for it this cycle. Targets do not decrease automatically
        or block approvals above the number.
      </p>
      {loading ? <p className={loadingClasses}>Loading positions…</p> : null}
      {!loading && !officeGroup ? (
        <p className={emptyClasses}>No positions under this office.</p>
      ) : null}
      {!loading && officeGroup ? (
        <div className={listClasses}>
          {officeGroup.positions.map((position) => (
            <HrPositionApprovalTargetRow
              key={position.id}
              position={position}
              value={drafts[position.id] ?? ""}
              disabled={pendingId !== null}
              pending={pendingId === position.id}
              onChange={(value) =>
                setDrafts((current) => ({
                  ...current,
                  [position.id]: value,
                }))
              }
              onSave={() => void saveTarget(position)}
            />
          ))}
        </div>
      ) : null}
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && message ? (
        <ActionFeedback type="success" message={message} />
      ) : null}
    </section>
  )
}
