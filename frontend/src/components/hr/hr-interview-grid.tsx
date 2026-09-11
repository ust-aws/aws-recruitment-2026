"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ActionFeedback } from "@/components/action-feedback"
import { SlotGrid, type SlotGridCell } from "@/components/interview/slot-grid"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field } from "@/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createInterviewSlot,
  listInterviewSlots,
  patchInterviewSlotOpen,
  resetInterviewSchedule,
  useOpenPositions,
  type HrInterviewSlot,
} from "@/lib/api"
import { groupedCommitteesForPicker } from "@/lib/committee-groups"
import type { InterviewSeasonBounds } from "@/lib/interview-season"
import {
  addDays,
  canGoNextWeek,
  canGoPrevWeek,
  clampWeekStart,
  formatWeekRange,
  slotKey,
  slotKeyFromIso,
  slotStartsAt,
  startOfWeek,
  weekDaysInSeason,
  weekQueryRange,
  INTERVIEW_GRID_END_HOUR,
  INTERVIEW_GRID_START_HOUR,
} from "@/lib/interview-season"
import { fieldControlClasses, glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const toolbarClasses = "mt-4 flex flex-wrap items-end justify-between gap-4"
const weekNavClasses = "flex flex-wrap items-center gap-2"
const weekLabelClasses = "min-w-[10rem] text-center font-sans text-sm text-blue-chalk"
const navButtonClasses = "h-9 px-4 text-xs"
const hintClasses = "mt-2 font-sans text-sm text-prelude"
const seasonClasses = "font-mono text-xs text-aquamarine"

function committeeOptions(
  positions: { committee: string; committee_id?: string }[]
) {
  const map = new Map<string, string>()
  for (const position of positions) {
    if (!position.committee_id || map.has(position.committee)) continue
    map.set(position.committee, position.committee_id)
  }
  return map
}

function buildHrCells(
  days: Date[],
  slots: HrInterviewSlot[]
): Map<string, SlotGridCell> {
  const byStart = new Map(slots.map((slot) => [slotKeyFromIso(slot.startsAt), slot]))
  const cells = new Map<string, SlotGridCell>()
  const rowCount = (INTERVIEW_GRID_END_HOUR - INTERVIEW_GRID_START_HOUR) * 2

  for (const day of days) {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const startsAt = slotStartsAt(day, rowIndex)
      const key = slotKey(startsAt)
      const slot = byStart.get(key)

      if (!slot) {
        cells.set(key, { key, startsAt, state: "unavailable" })
        continue
      }

      if (slot.booking) {
        cells.set(key, {
          key,
          startsAt,
          state: "booked",
          slotId: slot.id,
          detail: slot.booking.applicantName,
        })
        continue
      }

      cells.set(key, {
        key,
        startsAt,
        state: slot.isOpen ? "available" : "unavailable",
        slotId: slot.id,
        detail: slot.isOpen ? "Open" : "Closed",
      })
    }
  }

  return cells
}

function upsertSlot(slots: HrInterviewSlot[], next: HrInterviewSlot) {
  const index = slots.findIndex((slot) => slot.id === next.id)
  if (index === -1) return [...slots, next]
  const copy = [...slots]
  copy[index] = next
  return copy
}

type HrInterviewGridProps = {
  seasonBounds: InterviewSeasonBounds
  seasonLoading: boolean
  seasonConfigured: boolean
}

export function HrInterviewGrid({
  seasonBounds,
  seasonLoading,
  seasonConfigured,
}: HrInterviewGridProps) {
  const { positions, committees, loading: positionsLoading } = useOpenPositions()
  const committeeIds = useMemo(() => committeeOptions(positions), [positions])
  const groups = groupedCommitteesForPicker(committees)

  const [committeeName, setCommitteeName] = useState("")
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [slots, setSlots] = useState<HrInterviewSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetOpen, setResetOpen] = useState(false)

  const committeeId = committeeName ? committeeIds.get(committeeName) : undefined
  const days = useMemo(
    () => weekDaysInSeason(weekStart, seasonBounds),
    [weekStart, seasonBounds]
  )
  const weekLabel = formatWeekRange(weekStart, days)
  const cells = useMemo(() => buildHrCells(days, slots), [days, slots])

  useEffect(() => {
    if (!seasonBounds) return
    setWeekStart((current) => clampWeekStart(current, seasonBounds))
  }, [seasonBounds])

  const loadSlots = useCallback(async () => {
    if (!committeeId || !seasonConfigured) {
      setSlots([])
      return
    }
    if (slots.length === 0) setLoading(true)
    setError("")
    try {
      const range = weekQueryRange(weekStart, days)
      setSlots(
        await listInterviewSlots({
          committeeId,
          from: range.from,
          to: range.to,
        })
      )
    } catch (err) {
      setSlots([])
      setError(
        err instanceof Error ? err.message : "Could not load interview slots."
      )
    } finally {
      setLoading(false)
    }
  }, [committeeId, days, seasonConfigured, weekStart])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  async function openSlot(startsAt: Date, existing?: HrInterviewSlot) {
    if (!committeeId) return
    setPending(true)
    setError("")
    try {
      const next = existing
        ? await patchInterviewSlotOpen(existing.id, true)
        : await createInterviewSlot(committeeId, startsAt.toISOString())
      setSlots((current) => upsertSlot(current, next))
      setSuccess(existing ? "Slot reopened." : "Slot opened.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open slot.")
    } finally {
      setPending(false)
    }
  }

  async function resetSchedule() {
    if (!committeeId) return
    setPending(true)
    setError("")
    try {
      const result = await resetInterviewSchedule(committeeId)
      const parts = [
        `Removed ${result.deletedSlots} slot${result.deletedSlots === 1 ? "" : "s"}.`,
      ]
      if (result.deletedBookings > 0) {
        parts.push(
          `${result.deletedBookings} applicant booking${result.deletedBookings === 1 ? "" : "s"} cleared.`
        )
      }
      setSuccess(parts.join(" "))
      setResetOpen(false)
      await loadSlots()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset the schedule."
      )
    } finally {
      setPending(false)
    }
  }

  async function closeSlot(slot: HrInterviewSlot) {
    setPending(true)
    setError("")
    try {
      const next = await patchInterviewSlotOpen(slot.id, false)
      setSlots((current) => upsertSlot(current, next))
      setSuccess("Slot closed.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close slot.")
    } finally {
      setPending(false)
    }
  }

  function onCellClick(cell: SlotGridCell) {
    if (pending || !committeeId || !seasonConfigured) return

    const slot = cell.slotId
      ? slots.find((row) => row.id === cell.slotId)
      : slots.find((row) => slotKeyFromIso(row.startsAt) === cell.key)

    if (cell.state === "booked") return

    if (cell.state === "available" && slot) {
      void closeSlot(slot)
      return
    }

    if (cell.state === "unavailable") {
      if (slot && !slot.isOpen) {
        void openSlot(cell.startsAt, slot)
        return
      }
      void openSlot(cell.startsAt)
    }
  }

  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Interview Slots
      </h2>
      <p className={hintClasses}>
        Weeks run Sunday–Saturday; interviews are Monday–Saturday, 7:00 AM–9:30
        PM. Open 30-minute cells when the director or EB is free. Booked slots
        stay locked until you close them or reset the committee schedule.
      </p>
      <p className={`${hintClasses} ${seasonClasses}`}>
        Interview Season:{" "}
        {seasonConfigured ? (
          <>
            {seasonBounds!.startsAt.toLocaleDateString()} –{" "}
            {seasonBounds!.endsAt.toLocaleDateString()}
          </>
        ) : seasonLoading ? (
          <Skeleton className="ml-1 inline-block h-4 w-36 align-middle" />
        ) : (
          "Not configured — set dates above."
        )}
      </p>

      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && success ? (
        <ActionFeedback type="success" message={success} />
      ) : null}

      <div className={toolbarClasses}>
        <Field label="Committee" htmlFor="hr-interview-committee" className="min-w-[14rem] flex-1">
          <Select
            value={committeeName || null}
            disabled={positionsLoading}
            onValueChange={(value: string | null) => {
              setCommitteeName(value ?? "")
              setSlots([])
            }}
          >
            <SelectTrigger id="hr-interview-committee" className={fieldControlClasses}>
              <SelectValue placeholder="Select a committee" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectGroup key={group.office}>
                  <SelectLabel>{group.office}</SelectLabel>
                  {group.committees.map((committee) => (
                    <SelectItem key={committee} value={committee}>
                      {committee}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className={weekNavClasses}>
          <Button
            type="button"
            color="purple"
            className={navButtonClasses}
            disabled={!seasonConfigured || !canGoPrevWeek(weekStart, seasonBounds)}
            onClick={() =>
              setWeekStart((current) =>
                clampWeekStart(addDays(current, -7), seasonBounds)
              )
            }
          >
            ← Prev
          </Button>
          <p className={weekLabelClasses}>{weekLabel}</p>
          <Button
            type="button"
            color="purple"
            className={navButtonClasses}
            disabled={!seasonConfigured || !canGoNextWeek(weekStart, seasonBounds)}
            onClick={() =>
              setWeekStart((current) =>
                clampWeekStart(addDays(current, 7), seasonBounds)
              )
            }
          >
            Next →
          </Button>
        </div>

        <Button
          type="button"
          color="danger"
          className={navButtonClasses}
          disabled={!committeeId || pending}
          onClick={() => setResetOpen(true)}
        >
          Reset schedule
        </Button>
      </div>

      {!seasonConfigured && !seasonLoading ? (
        <p className={`${hintClasses} mt-6`} role="status">
          Interview season is not configured. Save interview dates above to manage
          slots.
        </p>
      ) : !committeeId ? (
        <p className={`${hintClasses} mt-6`}>Select a committee to manage its weekly grid.</p>
      ) : (
        <div className="mt-6">
          <SlotGrid
            days={days}
            cells={cells}
            loading={loading}
            scrollable
            scrollShellClassName="max-h-[min(40rem,calc(100vh-14rem))] overflow-x-hidden overflow-y-auto overscroll-contain"
            onCellClick={onCellClick}
            emptyMessage="No Monday–Saturday days fall in this interview week."
          />
        </div>
      )}

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          if (!pending && !open) setResetOpen(false)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reset interview schedule?</DialogTitle>
            <DialogDescription>
              {committeeName
                ? `This removes every open, closed, and booked interview slot for ${committeeName}, including applicant bookings. You cannot undo this.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              color="purple"
              disabled={pending}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              color="danger"
              disabled={pending || !committeeId}
              onClick={() => void resetSchedule()}
            >
              {pending ? "Resetting…" : "Reset schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
