"use client"

import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { SlotGrid, type SlotGridCell } from "@/components/interview/slot-grid"
import { InterviewWeekNav } from "@/components/interview/week-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/shared/field"
import { useInterviewWindow } from "@/hooks/use-interview-window"
import { listPositionInterviewSlots } from "@/lib/api/client"
import {
  formatInterviewSlotLabel,
  formatSeasonBoundsRange,
} from "@/lib/datetime/display"
import {
  addDays,
  canGoNextWeek,
  canGoPrevWeek,
  clampWeekStart,
  formatWeekRange,
  slotKeyFromIso,
  startOfWeek,
  weekDaysInSeason,
} from "@/lib/season/interview"

const hintClasses = "font-sans text-sm text-prelude"
const committeeClasses = "mt-1 font-mono text-xs text-aquamarine"
const errorClasses = "mt-2 font-sans text-sm text-aquamarine"
const selectedClasses = "mt-3 font-mono text-xs text-aquamarine"

type ApplyInterviewSlotPickerProps = {
  positionId: string
  selectedSlotId: string
  onSelectedSlotIdChange: (slotId: string) => void
}

function slotInWeek(slotIso: string, days: Date[]): boolean {
  if (days.length === 0) return false
  const time = new Date(slotIso).getTime()
  const start = new Date(days[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(days[days.length - 1])
  end.setDate(end.getDate() + 1)
  end.setHours(0, 0, 0, 0)
  return time >= start.getTime() && time < end.getTime()
}


export function ApplyInterviewSlotPicker({
  positionId,
  selectedSlotId,
  onSelectedSlotIdChange,
}: ApplyInterviewSlotPickerProps) {
  const {
    bounds: seasonBounds,
    loading: seasonLoading,
    configured: seasonConfigured,
  } = useInterviewWindow()
  const [committeeName, setCommitteeName] = useState("")
  const [slots, setSlots] = useState<
    { id: string; startsAt: string; endsAt: string }[]
  >([])
  const [booked, setBooked] = useState<
    { startsAt: string; endsAt: string }[]
  >([])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const displayedWeekStart = useMemo(
    () => clampWeekStart(weekStart, seasonBounds),
    [weekStart, seasonBounds]
  )
  const days = useMemo(
    () => weekDaysInSeason(displayedWeekStart, seasonBounds),
    [displayedWeekStart, seasonBounds]
  )
  const weekLabel = formatWeekRange(displayedWeekStart, days)

  const applySlots = useEffectEvent(
    (payload: Awaited<ReturnType<typeof listPositionInterviewSlots>>) => {
      setCommitteeName(payload.committee.name)
      setSlots(payload.slots)
      setBooked(payload.booked ?? [])
      if (
        selectedSlotId &&
        !payload.slots.some((slot) => slot.id === selectedSlotId)
      ) {
        onSelectedSlotIdChange("")
        return
      }
      const selected = payload.slots.find(
        (slot) => slot.id === selectedSlotId
      )
      if (selected && seasonBounds) {
        setWeekStart(
          clampWeekStart(startOfWeek(new Date(selected.startsAt)), seasonBounds)
        )
      }
    }
  )

  useEffect(() => {
    let cancelled = false
    listPositionInterviewSlots(positionId)
      .then((payload) => {
        if (!cancelled) applySlots(payload)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setCommitteeName("")
        setSlots([])
        setBooked([])
        setError(
          err instanceof Error
            ? err.message
            : "Could not load interview slots."
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [positionId])

  const weekSlots = useMemo(
    () => slots.filter((slot) => slotInWeek(slot.startsAt, days)),
    [days, slots]
  )

  const cells = useMemo(() => {
    const map = new Map<string, SlotGridCell>()
    for (const slot of weekSlots) {
      const key = slotKeyFromIso(slot.startsAt)
      map.set(key, {
        key,
        startsAt: new Date(slot.startsAt),
        state: selectedSlotId === slot.id ? "selected" : "available",
        slotId: slot.id,
      })
    }
    for (const occupied of booked) {
      if (!slotInWeek(occupied.startsAt, days)) continue
      const key = slotKeyFromIso(occupied.startsAt)
      if (!map.has(key)) {
        map.set(key, {
          key,
          startsAt: new Date(occupied.startsAt),
          state: "booked",
          detail: "Booked",
        })
      }
    }
    return map
  }, [booked, days, selectedSlotId, weekSlots])

  function onCellClick(cell: SlotGridCell) {
    if (!cell.slotId || cell.state === "booked") return
    onSelectedSlotIdChange(cell.slotId)
  }

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId)

  return (
    <Field label="Interview time slot" required>
      <div className={hintClasses}>
        Pick one open slot for your first-choice committee.
        {seasonConfigured ? (
          <>
            {" "}
            Season {formatSeasonBoundsRange(seasonBounds!.startsAt, seasonBounds!.endsAt)}.
          </>
        ) : seasonLoading ? (
          <Skeleton className="ml-1 inline-block h-4 w-40 align-middle" />
        ) : (
          " Interview season is not configured yet."
        )}
      </div>
      {committeeName ? (
        <p className={committeeClasses}>{committeeName}</p>
      ) : null}

      <InterviewWeekNav
        className="mt-4"
        weekLabel={weekLabel}
        prevDisabled={
          !seasonConfigured ||
          !canGoPrevWeek(displayedWeekStart, seasonBounds)
        }
        nextDisabled={
          !seasonConfigured ||
          !canGoNextWeek(displayedWeekStart, seasonBounds)
        }
        onPrev={() =>
          setWeekStart(
            clampWeekStart(addDays(displayedWeekStart, -7), seasonBounds),
          )
        }
        onNext={() =>
          setWeekStart(
            clampWeekStart(addDays(displayedWeekStart, 7), seasonBounds),
          )
        }
      />

      <div className="mt-4 min-w-0 w-full max-w-full">
        {seasonConfigured ? (
          <SlotGrid
            days={days}
            cells={cells}
            loading={loading}
            scrollable
            onCellClick={onCellClick}
            emptyMessage="No open interview slots this week. Try another week or check back later."
          />
        ) : seasonLoading ? (
          <SlotGrid days={[]} cells={new Map()} loading scrollable />
        ) : (
          <p className={errorClasses} role="status">
            Interview season is not configured. You cannot pick a slot yet.
          </p>
        )}
        {selectedSlot ? (
          <p className={selectedClasses} role="status">
            Selected: {formatInterviewSlotLabel(selectedSlot)}
          </p>
        ) : (
          <p className="mt-3 font-sans text-xs text-prelude">
            Tap a highlighted slot in the grid to select your interview time.
          </p>
        )}
      </div>

      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
    </Field>
  )
}
