"use client"

import { useEffect, useState } from "react"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  listOfficerHuntSeats,
  patchOfficerHuntSeat,
  type OfficerHuntSeat,
  type OfficerHuntSeatKind,
} from "@/lib/api/officer-hunt"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const headingClasses = "font-sans text-lg font-semibold text-blue-chalk"
const helpClasses = "mt-1 font-sans text-sm text-prelude"
const groupClasses = "mt-5 flex flex-col gap-2"
const groupHeadingClasses = "font-mono text-[11px] uppercase tracking-[0.14em] text-prelude"
const rowClasses = "flex flex-wrap items-center gap-3 rounded-[14px] bg-haiti/55 px-4 py-3"
const titleClasses = "min-w-0 flex-1 font-sans text-sm text-blue-chalk"
const kindClasses = "font-mono text-[11px] uppercase tracking-[0.12em] text-aquamarine"
const slotsClasses = "h-9 w-20"

const KIND_LABELS: Record<OfficerHuntSeatKind, string> = {
  eb: "Board",
  director: "Director",
  ea: "Executive assistant",
}

/** Seats in committee order, one group per committee. */
function groupByCommittee(seats: OfficerHuntSeat[]) {
  const groups = new Map<string, OfficerHuntSeat[]>()
  for (const seat of seats) groups.set(seat.committee, [...(groups.get(seat.committee) ?? []), seat])
  return [...groups]
}

function SeatRow({ seat, busy, onChange }: { seat: OfficerHuntSeat; busy: boolean; onChange: (patch: { isOpen?: boolean; openSlots?: number }) => void }) {
  return (
    <li className={rowClasses}>
      <span className={titleClasses}>{seat.title}</span>
      <span className={kindClasses}>{KIND_LABELS[seat.kind]}</span>
      {seat.kind === "ea" ? (
        <Input
          type="number"
          min={0}
          max={50}
          aria-label={`Places for ${seat.title}`}
          className={slotsClasses}
          defaultValue={seat.openSlots}
          disabled={busy}
          onBlur={(event) => {
            const openSlots = Number(event.target.value)
            if (Number.isInteger(openSlots) && openSlots !== seat.openSlots) onChange({ openSlots })
          }}
        />
      ) : null}
      <Button
        type="button"
        color={seat.isOpen ? "danger" : "cyan"}
        disabled={busy}
        aria-pressed={seat.isOpen}
        onClick={() => onChange({ isOpen: !seat.isOpen })}
      >
        {seat.isOpen ? "Close seat" : "Open seat"}
      </Button>
    </li>
  )
}

/** Which seats applicants can choose. The first time the dates are saved, every seat appears here, closed. */
export function HrOfficerHuntSeats({ refreshKey }: { refreshKey: number }) {
  const [seats, setSeats] = useState<OfficerHuntSeat[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    listOfficerHuntSeats()
      .then((rows) => {
        if (!cancelled) setSeats(rows)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load the seats.")
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  async function change(seat: OfficerHuntSeat, patch: { isOpen?: boolean; openSlots?: number }) {
    setBusy(true)
    setError("")
    try {
      setSeats(await patchOfficerHuntSeat(seat.id, patch))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the seat.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={panelClasses}>
      <h2 className={headingClasses}>Seats</h2>
      <p className={helpClasses}>
        Open the seats people can apply for. A board or director seat has one holder; executive assistants come in
        numbers, taken from the office&apos;s EA places.
      </p>
      {error ? <ActionFeedback type="error" message={error} /> : null}
      {seats && seats.length === 0 ? (
        <p className={helpClasses}>Save the term and dates first, and the seats will appear here.</p>
      ) : null}
      {seats
        ? groupByCommittee(seats).map(([committee, rows]) => (
            <div key={committee} className={groupClasses}>
              <h3 className={groupHeadingClasses}>{committee}</h3>
              <ul className="flex flex-col gap-2">
                {rows.map((seat) => (
                  <SeatRow key={seat.id} seat={seat} busy={busy} onChange={(patch) => void change(seat, patch)} />
                ))}
              </ul>
            </div>
          ))
        : null}
    </section>
  )
}
