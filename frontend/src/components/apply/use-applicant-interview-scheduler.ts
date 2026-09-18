import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react"
import { type SlotGridCell } from "@/components/interview/slot-grid"
import {
  getApplicantInterviewSlots,
  putApplicantInterviewBooking,
  type ApplicantInterviewSchedule,
} from "@/lib/api/applicant"
import { useInterviewWindow } from "@/hooks/use-interview-window"
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
import {
  applyInterviewSchedule,
  buildApplicantCells,
  slotBelongsToSchedule,
  slotInWeek,
} from "@/components/apply/applicant-interview-scheduler-helpers"

type UseApplicantInterviewSchedulerOptions = {
  positionId?: string
  previewMode?: boolean
  selectedSlotId?: string
  onSelectedSlotIdChange?: (slotId: string) => void
  onScheduleLoaded?: (schedule: ApplicantInterviewSchedule) => void
}

export function useApplicantInterviewScheduler({
  positionId,
  previewMode = false,
  selectedSlotId: controlledSlotId,
  onSelectedSlotIdChange,
  onScheduleLoaded,
}: UseApplicantInterviewSchedulerOptions) {
  const {
    bounds: seasonBounds,
    loading: seasonLoading,
    configured: seasonConfigured,
  } = useInterviewWindow()
  const [schedule, setSchedule] = useState<ApplicantInterviewSchedule | null>(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [internalSelectedId, setInternalSelectedId] = useState("")

  const selectedSlotId = controlledSlotId ?? internalSelectedId
  const setSelectedSlotId = onSelectedSlotIdChange ?? setInternalSelectedId
  const displayedWeekStart = useMemo(
    () => clampWeekStart(weekStart, seasonBounds),
    [weekStart, seasonBounds],
  )
  const days = useMemo(
    () => weekDaysInSeason(displayedWeekStart, seasonBounds),
    [displayedWeekStart, seasonBounds],
  )
  const weekLabel = formatWeekRange(displayedWeekStart, days)

  const selectionForGrid = useMemo(() => {
    if (!selectedSlotId || !schedule) return ""
    return slotBelongsToSchedule(schedule, selectedSlotId, previewMode)
      ? selectedSlotId
      : ""
  }, [previewMode, schedule, selectedSlotId])

  const scheduleContext = {
    previewMode,
    selectedSlotId: selectionForGrid,
    seasonBounds,
    onScheduleLoaded,
    setSchedule,
    setSelectedSlotId,
    setWeekStart,
  }

  const applySchedule = useEffectEvent((payload: ApplicantInterviewSchedule) => {
    applyInterviewSchedule(payload, scheduleContext)
  })

  useEffect(() => {
    let cancelled = false
    getApplicantInterviewSlots(positionId)
      .then((payload) => {
        if (!cancelled) applySchedule(payload)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSchedule(null)
        setError(
          err instanceof Error
            ? err.message
            : "Interview scheduling is temporarily unavailable. Try again in a moment.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [positionId])

  async function refreshSchedule() {
    setLoading(true)
    setError("")
    try {
      applyInterviewSchedule(
        await getApplicantInterviewSlots(positionId),
        scheduleContext,
      )
    } catch (err) {
      setSchedule(null)
      setError(
        err instanceof Error
          ? err.message
          : "Interview scheduling is temporarily unavailable. Try again in a moment.",
      )
    } finally {
      setLoading(false)
    }
  }

  const weekSlots = useMemo(() => {
    if (!schedule) return []
    const visible = [...schedule.slots]
    if (
      !previewMode &&
      schedule.booking &&
      !visible.some((slot) => slot.id === schedule.booking?.slotId)
    ) {
      visible.push({
        id: schedule.booking.slotId,
        startsAt: schedule.booking.startsAt,
        endsAt: schedule.booking.endsAt,
      })
    }
    return visible.filter((slot) => slotInWeek(slot.startsAt, days))
  }, [days, previewMode, schedule])

  const cells = useMemo(() => {
    if (!schedule) return new Map<string, SlotGridCell>()
    const filtered: ApplicantInterviewSchedule = {
      ...schedule,
      slots: weekSlots,
    }
    const map = buildApplicantCells(filtered, selectionForGrid, previewMode)
    if (schedule.booked) {
      for (const occupied of schedule.booked) {
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
    }

    return map
  }, [days, previewMode, schedule, selectionForGrid, weekSlots])

  const canConfirm =
    schedule?.canSchedule &&
    selectionForGrid &&
    selectionForGrid !== schedule.booking?.slotId

  async function confirmBooking() {
    if (!selectionForGrid || !schedule?.canSchedule) return
    setPending(true)
    setError("")
    setSuccess("")
    try {
      const result = await putApplicantInterviewBooking(selectionForGrid)
      setSuccess(
        result.booking.rescheduled
          ? "Interview rescheduled."
          : "Interview booked.",
      )
      await refreshSchedule()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not confirm this interview slot.",
      )
    } finally {
      setPending(false)
    }
  }

  const onCellClick = useCallback(
    (cell: SlotGridCell) => {
      if (pending || !schedule?.canSchedule || !cell.slotId) return
      if (cell.state === "booked" || cell.state === "unavailable") return
      if (cell.slotId === selectedSlotId) return
      setSelectedSlotId(cell.slotId)
      setSuccess("")
      setError("")
    },
    [pending, schedule?.canSchedule, selectedSlotId, setSelectedSlotId],
  )

  const gridLocked = pending
  const weekNavDisabled = pending || !seasonConfigured
  const goPrevWeek = useCallback(() => {
    setWeekStart(clampWeekStart(addDays(displayedWeekStart, -7), seasonBounds))
  }, [displayedWeekStart, seasonBounds])
  const goNextWeek = useCallback(() => {
    setWeekStart(clampWeekStart(addDays(displayedWeekStart, 7), seasonBounds))
  }, [displayedWeekStart, seasonBounds])

  const shellProps = {
    schedule,
    seasonConfigured,
    seasonLoading,
    seasonBounds,
    days,
    cells,
    loading,
    weekNav: {
      weekLabel,
      disabled: weekNavDisabled,
      canGoPrev: canGoPrevWeek(displayedWeekStart, seasonBounds),
      canGoNext: canGoNextWeek(displayedWeekStart, seasonBounds),
      onPrev: goPrevWeek,
      onNext: goNextWeek,
    },
    gridLocked,
    onCellClick,
    error,
  }

  return {
    shellProps,
    previewMode,
    success,
    canConfirm,
    pending,
    confirmBooking,
    showConfirm: Boolean(schedule?.canSchedule && !previewMode),
  }
}
