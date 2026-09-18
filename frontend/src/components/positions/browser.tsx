"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/shared/section-header"
import { PositionsList } from "@/components/positions/list"
import { PositionDetail } from "@/components/positions/position-detail"
import type { Position } from "@/lib/positions"
import { groupPositionsByOfficeHierarchy } from "@/lib/positions"
import { cn } from "@/lib/utils"

const shellClasses = "flex min-w-0 flex-col gap-8 overflow-x-clip"
const introClasses = "flex flex-col items-start text-left"
const metaClasses =
  "w-full font-mono text-xs uppercase tracking-wide text-prelude text-left"
const backButtonClasses =
  "mb-3 flex w-fit items-center gap-1.5 rounded-pill border border-blue-chalk/25 bg-transparent px-3 py-1.5 font-mono text-xs text-blue-chalk transition-colors hover:bg-blue-chalk/10 lg:hidden"
const listPaneClasses = "min-h-0 min-w-0"
const detailPaneClasses =
  "flex min-h-0 min-w-0 flex-col px-4 pt-4 lg:p-0"
const accentClasses = "text-aquamarine"
const boardClasses =
  "grid min-h-[min(72vh,46rem)] min-w-0 overflow-hidden rounded-[28px] border border-blue-chalk/20 bg-haiti lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]"
const stateClasses =
  "flex min-h-72 flex-col items-center justify-center gap-3 rounded-[28px] border border-blue-chalk/20 bg-haiti px-6 text-center"
const stateTitleClasses = "font-sans text-xl font-semibold text-blue-chalk"
const stateCopyClasses = "max-w-lg font-sans text-sm leading-relaxed text-prelude"
const detailEmptyClasses =
  "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center"
const detailEmptyTitleClasses = "font-sans text-lg font-semibold text-blue-chalk"
const detailEmptyCopyClasses = "max-w-sm font-sans text-sm leading-relaxed text-prelude"

type PositionsBrowserProps = {
  positions: Position[]
  loadError?: boolean
  applicationsOpen?: boolean
}

export function PositionsBrowser({
  positions,
  loadError = false,
  applicationsOpen = true,
}: PositionsBrowserProps) {
  const officeGroups = groupPositionsByOfficeHierarchy(positions)
  const officeCount = officeGroups.length
  const [selectedId, setSelectedId] = useState("")
  const [mobileShowsDetail, setMobileShowsDetail] = useState(false)
  const selected = positions.find((position) => position.id === selectedId)

  function selectPosition(id: string) {
    setSelectedId(id)
    setMobileShowsDetail(true)
  }
  const stateTitle = loadError
    ? "Positions are temporarily unavailable."
    : "There are no open positions right now."
  const stateCopy = loadError
    ? "The positions service could not be reached. Please try again later."
    : "Check back soon for new opportunities with AWS Builders – UST."

  return (
    <div className={shellClasses}>
      <div className={introClasses}>
        <SectionHeader
          eyebrow="$ ls positions/"
          title={
            <>
              Find a role that <span className={accentClasses}>fits</span>.
            </>
          }
          subtitle="Browse open executive assistant and committee staff roles. Select a role to read the full description, then apply."
          className="items-start"
          titleClassName="mx-0"
        />

        <p className={metaClasses}>
        {loadError
          ? "positions unavailable"
          : `${positions.length} open roles · ${officeCount} offices`}
        </p>
      </div>

      {positions.length > 0 ? (
        <div className={boardClasses}>
          <div
            className={cn(
              listPaneClasses,
              mobileShowsDetail && "hidden lg:block"
            )}
          >
            <PositionsList
              officeGroups={officeGroups}
              selectedId={selectedId}
              onSelect={selectPosition}
            />
          </div>
          <div
            className={cn(
              detailPaneClasses,
              !mobileShowsDetail && "hidden lg:flex"
            )}
          >
            {mobileShowsDetail ? (
              <button
                type="button"
                className={backButtonClasses}
                onClick={() => setMobileShowsDetail(false)}
              >
                ← All roles
              </button>
            ) : null}
            {selected ? (
              <PositionDetail
                position={selected}
                applicationsOpen={applicationsOpen}
              />
            ) : (
              <div className={detailEmptyClasses}>
                <p className={detailEmptyTitleClasses}>Select a role</p>
                <p className={detailEmptyCopyClasses}>
                  Choose a position from the list to read the full description and
                  apply.
                </p>
              </div>
            )}
          </div>
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
