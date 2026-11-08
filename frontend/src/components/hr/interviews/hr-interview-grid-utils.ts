import type { SlotGridCell } from "@/components/interview/slot-grid"
import type { HrInterviewSlot } from "@/lib/api"
import {
  slotKey,
  slotKeyFromIso,
  slotStartsAt,
  INTERVIEW_GRID_END_HOUR,
  INTERVIEW_GRID_START_HOUR,
} from "@/lib/season/interview"

export function committeeOptions(
  positions: { committee: string; committee_id?: string }[],
) {
  const map = new Map<string, string>()
  for (const position of positions) {
    if (!position.committee_id || map.has(position.committee)) continue
    map.set(position.committee, position.committee_id)
  }
  return map
}

export function buildHrInterviewGridCells(
  days: Date[],
  slots: HrInterviewSlot[],
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

export function upsertHrInterviewSlot(slots: HrInterviewSlot[], next: HrInterviewSlot) {
  const index = slots.findIndex((slot) => slot.id === next.id)
  if (index === -1) return [...slots, next]
  const copy = [...slots]
  copy[index] = next
  return copy
}
