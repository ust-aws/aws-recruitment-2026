import type { SlotGridCell } from "@/components/interview/slot-grid"
import type { ApplicantInterviewSchedule } from "@/lib/api/applicant"
import {
  clampWeekStart,
  slotKeyFromIso,
  startOfWeek,
  type InterviewSeasonBounds,
} from "@/lib/season/interview"

export function buildApplicantCells(
  schedule: ApplicantInterviewSchedule,
  selectedSlotId: string,
  previewMode: boolean,
): Map<string, SlotGridCell> {
  const cells = new Map<string, SlotGridCell>()
  const showSavedBooking = !previewMode && Boolean(schedule.booking)
  const bookingId = showSavedBooking ? schedule.booking?.slotId : undefined

  for (const slot of schedule.slots) {
    const key = slotKeyFromIso(slot.startsAt)
    const isSelected = Boolean(selectedSlotId) && selectedSlotId === slot.id
    const isCurrent = Boolean(bookingId) && bookingId === slot.id && !isSelected

    cells.set(key, {
      key,
      startsAt: new Date(slot.startsAt),
      state: isSelected ? "selected" : isCurrent ? "current" : "available",
      slotId: slot.id,
      detail: isCurrent ? "Your booking" : undefined,
    })
  }

  return cells
}

export function slotBelongsToSchedule(
  schedule: ApplicantInterviewSchedule,
  slotId: string,
  previewMode: boolean,
): boolean {
  if (schedule.slots.some((slot) => slot.id === slotId)) return true
  if (!previewMode && schedule.booking?.slotId === slotId) return true
  return false
}

export function slotInWeek(slotIso: string, days: Date[]): boolean {
  if (days.length === 0) return false
  const time = new Date(slotIso).getTime()
  const start = new Date(days[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(days[days.length - 1])
  end.setDate(end.getDate() + 1)
  end.setHours(0, 0, 0, 0)
  return time >= start.getTime() && time < end.getTime()
}

export type ApplyInterviewScheduleContext = {
  previewMode: boolean
  selectedSlotId: string
  seasonBounds: InterviewSeasonBounds
  onScheduleLoaded?: (schedule: ApplicantInterviewSchedule) => void
  setSchedule: (schedule: ApplicantInterviewSchedule) => void
  setSelectedSlotId: (slotId: string) => void
  setWeekStart: (weekStart: Date) => void
}

export function applyInterviewSchedule(
  payload: ApplicantInterviewSchedule,
  ctx: ApplyInterviewScheduleContext,
) {
  ctx.setSchedule(payload)
  ctx.onScheduleLoaded?.(payload)
  if (ctx.previewMode) return
  if (!payload.booking || ctx.selectedSlotId) return
  ctx.setSelectedSlotId(payload.booking.slotId)
  if (ctx.seasonBounds) {
    ctx.setWeekStart(
      clampWeekStart(
        startOfWeek(new Date(payload.booking.startsAt)),
        ctx.seasonBounds,
      ),
    )
  }
}
