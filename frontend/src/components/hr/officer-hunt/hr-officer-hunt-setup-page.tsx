"use client"

import { useState } from "react"
import { HrInterviewGrid } from "@/components/hr/interviews/hr-interview-grid"
import { HrOfficerHuntDates } from "@/components/hr/officer-hunt/hr-officer-hunt-dates"
import { HrOfficerHuntSeats } from "@/components/hr/officer-hunt/hr-officer-hunt-seats"
import { HrSectionNav } from "@/components/hr/shell/hr-section-nav"
import { SectionHeader } from "@/components/shared/section-header"
import { useOfficerHuntSettings } from "@/hooks/use-officer-hunt-settings"
import { RecruitmentTrackProvider } from "@/lib/recruitment-track"
import { hrPageShellClasses } from "@/lib/site/surface"

const stackClasses = "mt-4 flex flex-col gap-4"
const anchorClasses = "scroll-mt-24"

const sectionNavItems = [
  { id: "hunt-dates", label: "Term and Dates" },
  { id: "hunt-seats", label: "Seats" },
  { id: "hunt-grid", label: "Availability Grid" },
]

/** Everything HR sets before the officer hunt opens: the term, the dates, the seats and interview slots. */
export function HrOfficerHuntSetupPage() {
  const { settings, bounds, loading, error, configured, apply } = useOfficerHuntSettings()
  // Saving the dates lays out the seats, so the seat list reloads after each save.
  const [seatsVersion, setSeatsVersion] = useState(0)

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// OFFICER HUNT"
        title="Officer Hunt Setup"
        subtitle="Set the term and dates, open the seats people can apply for, and publish interview slots."
      />
      <HrSectionNav items={sectionNavItems} />
      <div className={stackClasses}>
        <div id="hunt-dates" className={anchorClasses}>
          {loading ? null : (
            <HrOfficerHuntDates
              key={settings?.termYear ?? "new"}
              settings={settings}
              onSaved={(saved) => {
                apply(saved)
                setSeatsVersion((version) => version + 1)
              }}
            />
          )}
          {error ? <p className="mt-3 font-sans text-sm text-rose-glow">{error}</p> : null}
        </div>
        <div id="hunt-seats" className={anchorClasses}>
          <HrOfficerHuntSeats refreshKey={seatsVersion} />
        </div>
        <div id="hunt-grid" className={anchorClasses}>
          <RecruitmentTrackProvider track="officer_hunt">
            <HrInterviewGrid seasonBounds={bounds} seasonLoading={loading} seasonConfigured={configured} />
          </RecruitmentTrackProvider>
        </div>
      </div>
    </main>
  )
}
