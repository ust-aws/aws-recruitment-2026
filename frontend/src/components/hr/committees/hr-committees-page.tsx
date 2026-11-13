"use client"

import { useState } from "react"
import { SectionHeader } from "@/components/shared/section-header"
import { HrCommitteeApplicationControls } from "@/components/hr/committees/hr-committee-application-controls"
import { HrCommitteeOfficeSelect } from "@/components/hr/committees/hr-committee-office-select"
import { HrPositionApprovalTargets } from "@/components/hr/committees/hr-position-approval-targets"
import { defaultCommitteeOffice } from "@/lib/apply/committee-groups"
import { hrPageShellClasses } from "@/lib/site/surface"

const stackClasses = "mt-8 flex flex-col gap-4"
const filterClasses = "mt-6"

export function HrCommitteesPage() {
  const [office, setOffice] = useState(defaultCommitteeOffice)

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// COMMITTEES"
        title="Committees"
        subtitle="Choose an executive office, then manage application availability and approval targets for its committees."
      />
      <div className={filterClasses}>
        <HrCommitteeOfficeSelect value={office} onChange={setOffice} />
      </div>
      <div className={stackClasses}>
        <HrCommitteeApplicationControls officeFilter={office} />
        <HrPositionApprovalTargets officeFilter={office} />
      </div>
    </main>
  )
}
