"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/shared/section-header"
import { BoardToggle, type PeopleView } from "@/components/people/board-toggle"
import { PersonCard } from "@/components/people/person-card"
import { COMMITTEE_DIRECTORS, EXECUTIVE_BOARD } from "@/lib/people"

const shellClasses = "flex flex-col gap-10"
const gridClasses =
  "grid auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4"
const lonelyDirectorWrapperClasses =
  "w-full sm:col-span-2 sm:flex sm:justify-center lg:col-span-4"
const lonelyDirectorInnerClasses =
  "w-full sm:max-w-[calc((100%-1.25rem)/2)] lg:max-w-[calc((100%-3.75rem)/4)]"
function renderDirectorCard(seat: (typeof COMMITTEE_DIRECTORS)[number], index: number) {
  const isLast = index === COMMITTEE_DIRECTORS.length - 1
  const lonelyOnSm = isLast && COMMITTEE_DIRECTORS.length % 2 === 1
  const lonelyOnLg = isLast && COMMITTEE_DIRECTORS.length % 4 === 1

  if (!lonelyOnSm && !lonelyOnLg) {
    return <PersonCard key={seat.id} terms={[seat.current]} />
  }

  return (
    <div key={seat.id} className={lonelyDirectorWrapperClasses}>
      <div className={lonelyDirectorInnerClasses}>
        <PersonCard terms={[seat.current]} />
      </div>
    </div>
  )
}

export function PeopleDirectory() {
  const [view, setView] = useState<PeopleView>("executive-board")

  return (
    <section id="people" className={`${shellClasses} scroll-mt-20`}>
      <SectionHeader
        eyebrow="// THE PEOPLE"
        title="Meet the People behind our org!"
        subtitle="Meet the members of our organization! Click a photo for a better view of our faces."
      />

      <BoardToggle value={view} onChange={setView} />

      <div
        className={gridClasses}
        role="tabpanel"
        aria-label={
          view === "executive-board" ? "Executive Boards" : "Committee Directors"
        }
      >
        {view === "executive-board"
          ? EXECUTIVE_BOARD.map((seat) => (
              <PersonCard
                key={seat.id}
                terms={[seat.current, seat.previous]}
                showPager
              />
            ))
          : COMMITTEE_DIRECTORS.map(renderDirectorCard)}
      </div>
    </section>
  )
}
