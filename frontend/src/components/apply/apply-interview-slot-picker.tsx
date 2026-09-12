"use client"

import { useEffect, useEffectEvent, useMemo, useState } from "react"
import { SlotGrid, type SlotGridCell } from "@/components/interview/slot-grid"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { useInterviewWindow } from "@/hooks/use-interview-window"
import { listPositionInterviewSlots } from "@/lib/api-client"
import {
  addDays,
  canGoNextWeek,
  canGoPrevWeek,
  clampWeekStart,
  formatWeekRange,
  slotKeyFromIso,
  startOfWeek,
  weekDaysInSeason,
} from "@/lib/interview-season"

const hintClasses = "font-sans text-sm text-prelude"
const committeeClasses = "mt-1 font-mono text-xs text-aquamarine"
const weekNavClasses = "mt-4 flex flex-wrap items-center gap-2"
const weekLabelClasses = "min-w-[10rem] text-center font-sans text-sm text-blue-chalk"
const navButtonClasses = "h-9 px-4 text-xs"
const errorClasses = "mt-2 font-sans text-sm text-aquamarine"

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
        detail: new Date(slot.startsAt).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
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

  return (
    <Field label="Interview time slot" required>
      <div className={hintClasses}>
        Pick one open slot for your first-choice committee.
        {seasonConfigured ? (
          <>
            {" "}
            Season {seasonBounds!.startsAt.toLocaleDateString()} –{" "}
            {seasonBounds!.endsAt.toLocaleDateString()}.
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

      <div className={`${weekNavClasses} max-w-full`}>
        <Button
          type="button"
          color="purple"
          className={navButtonClasses}
          disabled={!seasonConfigured || !canGoPrevWeek(displayedWeekStart, seasonBounds)}
          onClick={() =>
            setWeekStart(
              clampWeekStart(addDays(displayedWeekStart, -7), seasonBounds)
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
          disabled={!seasonConfigured || !canGoNextWeek(displayedWeekStart, seasonBounds)}
          onClick={() =>
            setWeekStart(
              clampWeekStart(addDays(displayedWeekStart, 7), seasonBounds)
            )
          }
        >
          Next →
        </Button>
      </div>

      <div className="mt-4 min-w-0 w-full">
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
      </div>

      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
    </Field>
  )
}
