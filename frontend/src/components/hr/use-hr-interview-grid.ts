import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SlotGridCell } from "@/components/interview/slot-grid"
import {
  createInterviewSlot,
  listInterviewSlots,
  patchInterviewSlotOpen,
  resetInterviewSchedule,
  useOpenPositions,
  type HrInterviewSlot,
} from "@/lib/api"
import { groupedCommitteesForPicker } from "@/lib/apply/committee-groups"
import type { InterviewSeasonBounds } from "@/lib/season/interview"
import {
  clampWeekStart,
  formatWeekRange,
  slotKeyFromIso,
  startOfWeek,
  weekDaysInSeason,
  weekQueryRange,
} from "@/lib/season/interview"

import {
  buildHrInterviewGridCells,
  committeeOptions,
  upsertHrInterviewSlot,
} from "@/components/hr/hr-interview-grid-utils"

type SlotDrag = {
  action: "open" | "close"
  cells: Map<string, SlotGridCell>
}

export function useHrInterviewGrid(seasonBounds: InterviewSeasonBounds, seasonConfigured: boolean) {
  const { positions, committees, loading: positionsLoading } = useOpenPositions()
  const committeeIds = useMemo(() => committeeOptions(positions), [positions])
  const groups = useMemo(
    () => groupedCommitteesForPicker(committees),
    [committees],
  )

  const [committeeName, setCommitteeName] = useState("")
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [slots, setSlots] = useState<HrInterviewSlot[]>([])
  const dragRef = useRef<SlotDrag | null>(null)
  const [draggedCellKeys, setDraggedCellKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [gridReady, setGridReady] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const committeeId = committeeName ? committeeIds.get(committeeName) : undefined
  const displayedWeekStart = useMemo(
    () => clampWeekStart(weekStart, seasonBounds),
    [weekStart, seasonBounds],
  )
  const days = useMemo(
    () => weekDaysInSeason(displayedWeekStart, seasonBounds),
    [displayedWeekStart, seasonBounds],
  )
  const weekLabel = formatWeekRange(displayedWeekStart, days)
  const cells = useMemo(() => buildHrInterviewGridCells(days, slots), [days, slots])

  const fetchSlots = useCallback(() => {
    if (!committeeId || !seasonConfigured) {
      return Promise.resolve<HrInterviewSlot[]>([])
    }
    const range = weekQueryRange(displayedWeekStart, days)
    return listInterviewSlots({
      committeeId,
      from: range.from,
      to: range.to,
    })
  }, [committeeId, days, displayedWeekStart, seasonConfigured])

  useEffect(() => {
    if (!committeeId || !seasonConfigured) {
      return
    }
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setFetching(true)
      fetchSlots()
        .then((rows) => {
          if (!cancelled) {
            setSlots(rows)
            setGridReady(true)
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return
          setError(
            err instanceof Error ? err.message : "Could not load interview slots.",
          )
        })
        .finally(() => {
          if (!cancelled) setFetching(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [committeeId, fetchSlots, seasonConfigured])


  const resetSchedule = useCallback(async () => {
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
          `${result.deletedBookings} applicant booking${result.deletedBookings === 1 ? "" : "s"} cleared.`,
        )
      }
      setSuccess(parts.join(" "))
      setResetOpen(false)
      setSlots(await fetchSlots())
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset the schedule.",
      )
    } finally {
      setPending(false)
    }
  }, [committeeId, fetchSlots])


  const startSlotDrag = useCallback(
    (cell: SlotGridCell) => {
      if (pending || !committeeId || !seasonConfigured || cell.state === "booked") {
        return
      }
      dragRef.current = {
        action: cell.state === "available" ? "close" : "open",
        cells: new Map([[cell.key, cell]]),
      }
      setDraggedCellKeys(new Set([cell.key]))
    },
    [committeeId, pending, seasonConfigured],
  )

  const extendSlotDrag = useCallback((cell: SlotGridCell) => {
    const drag = dragRef.current
    if (!drag || cell.state === "booked") return
    drag.cells.set(cell.key, cell)
    setDraggedCellKeys(new Set(drag.cells.keys()))
  }, [])

  const finishSlotDrag = useCallback(async () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    setDraggedCellKeys(new Set())
    if (pending || !committeeId) return

    const slotsById = new Map(slots.map((slot) => [slot.id, slot]))
    const slotsByStart = new Map(
      slots.map((slot) => [slotKeyFromIso(slot.startsAt), slot]),
    )
    const requests: Promise<HrInterviewSlot | null>[] = []
    for (const cell of drag.cells.values()) {
      const existing = cell.slotId
        ? slotsById.get(cell.slotId)
        : slotsByStart.get(cell.key)
      if (existing?.booking) continue
      if (drag.action === "open") {
        if (!existing) {
          requests.push(createInterviewSlot(committeeId, cell.startsAt.toISOString()))
        } else if (!existing.isOpen) {
          requests.push(patchInterviewSlotOpen(existing.id, true))
        }
      } else if (existing?.isOpen) {
        requests.push(patchInterviewSlotOpen(existing.id, false))
      }
    }
    if (requests.length === 0) return

    setPending(true)
    setError("")
    setSuccess("")
    try {
      const results = await Promise.allSettled(requests)
      const updatedSlots = results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      )
      if (updatedSlots.length > 0) {
        setSlots((current) =>
          updatedSlots.reduce(upsertHrInterviewSlot, current),
        )
      }
      if (results.some((result) => result.status === "rejected")) {
        setError("Some interview slots could not be updated. Refresh and try again.")
        return
      }
      const action = drag.action === "open" ? "Opened" : "Closed"
      setSuccess(
        `${action} ${updatedSlots.length} slot${updatedSlots.length === 1 ? "" : "s"}.`,
      )
    } finally {
      setPending(false)
    }
  }, [committeeId, pending, slots])

  useEffect(() => {
    window.addEventListener("pointerup", finishSlotDrag)
    window.addEventListener("pointercancel", finishSlotDrag)
    return () => {
      window.removeEventListener("pointerup", finishSlotDrag)
      window.removeEventListener("pointercancel", finishSlotDrag)
    }
  }, [finishSlotDrag])

  const onCellClick = useCallback(
    (cell: SlotGridCell) => {
      startSlotDrag(cell)
      void finishSlotDrag()
    },
    [finishSlotDrag, startSlotDrag],
  )

  const selectCommittee = useCallback((name: string) => {
    setCommitteeName(name)
    dragRef.current = null
    setDraggedCellKeys(new Set())
    setSlots([])
    setGridReady(false)
    setError("")
  }, [])

  const loading = fetching && !gridReady

  return {
    groups,
    positionsLoading,
    committeeName,
    selectCommittee,
    committeeId,
    displayedWeekStart,
    seasonBounds: seasonBounds,
    days,
    cells,
    loading,
    fetching,
    pending,
    error,
    setError,
    success,
    weekLabel,
    weekStart,
    setWeekStart,
    resetOpen,
    setResetOpen,
    onCellClick,
    onCellPointerDown: startSlotDrag,
    onCellPointerEnter: extendSlotDrag,
    draggedCellKeys,
    resetSchedule,
  }
}
