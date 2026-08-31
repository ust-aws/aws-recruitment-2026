"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/section-header"
import { PositionsList } from "@/components/positions-list"
import { PositionDetail } from "@/components/position-detail"
import type { Position } from "@/lib/positions"
import { groupPositionsByOffice } from "@/lib/positions"

const shellClasses = "relative flex flex-col gap-8"
const glowLeftClasses =
  "pointer-events-none absolute -left-28 top-10 h-56 w-56 rounded-full bg-aquamarine/12 blur-3xl"
const glowRightClasses =
  "pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-biloba-flower/18 blur-3xl"
const accentClasses = "text-aquamarine"
const metaClasses = "font-mono text-xs uppercase tracking-wide text-prelude"
const boardClasses =
  "glass relative grid min-h-[min(72vh,46rem)] overflow-hidden rounded-[28px] border border-blue-chalk/20 bg-haiti/30 lg:grid-cols-[minmax(0,23rem)_1fr]"
const stateClasses =
  "glass flex min-h-72 flex-col items-center justify-center gap-3 rounded-[28px] border border-blue-chalk/20 bg-haiti/30 px-6 text-center"
const stateTitleClasses = "font-sans text-xl font-semibold text-blue-chalk"
const stateCopyClasses = "max-w-lg font-sans text-sm leading-relaxed text-prelude"

type PositionsBrowserProps = {
  positions: Position[]
  loadError?: boolean
}

export function PositionsBrowser({
  positions,
  loadError = false,
}: PositionsBrowserProps) {
  const officeCount = groupPositionsByOffice(positions).length
  const [selectedId, setSelectedId] = useState(positions[0]?.id ?? "")
  const selected =
    positions.find((position) => position.id === selectedId) ?? positions[0]
  const stateTitle = loadError
    ? "Positions are temporarily unavailable."
    : "There are no open positions right now."
  const stateCopy = loadError
    ? "The positions service could not be reached. Please try again later."
    : "Check back soon for new opportunities with AWS Builders – UST."

  return (
    <div className={shellClasses}>
      <div className={glowLeftClasses} />
      <div className={glowRightClasses} />

      <SectionHeader
        eyebrow="$ ls positions/"
        title={
          <>
            Find a role that <span className={accentClasses}>fits</span>.
          </>
        }
        subtitle="Browse executive assistant and committee staff openings. Pick a role on the left, read it on the right, then apply."
      />

      <p className={metaClasses}>
        {loadError
          ? "positions unavailable"
          : `${positions.length} open roles · ${officeCount} offices`}
      </p>

      {selected ? (
        <div className={boardClasses}>
          <PositionsList
            positions={positions}
            selectedId={selected.id}
            onSelect={setSelectedId}
          />
          <PositionDetail position={selected} />
        </div>
      ) : (
        <div role={loadError ? "alert" : "status"} className={stateClasses}>
          <h1 className={stateTitleClasses}>{stateTitle}</h1>
          <p className={stateCopyClasses}>{stateCopy}</p>
        </div>
      )}
    </div>
  )
}
