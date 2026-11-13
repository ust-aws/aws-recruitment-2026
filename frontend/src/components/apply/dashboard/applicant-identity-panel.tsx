"use client"

import { ApplicantDashboardProfile } from "@/components/apply/dashboard/applicant-dashboard-profile"
import { ApplicantDocumentEditor } from "@/components/apply/dashboard/applicant-document-editor"
import { ApplicantR101Trail } from "@/components/apply/dashboard/applicant-r101-trail"
import { ApplicantStatusChip } from "@/components/apply/dashboard/applicant-status-chip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { ApplicantApplication } from "@/lib/api/applicant"
import type { ApplicantDashboardState } from "@/lib/apply/dashboard-state"
import type { R101Trail } from "@/lib/apply/r101-trail"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Who this is and where they stand, always visible; everything they submitted
// folds into "Your application", open while they can still edit it.
const panelClasses = cn(dashboardPanelClasses, "min-w-0 px-5 pt-5 sm:px-6 sm:pt-6")
const officerPanelClasses = cn(panelClasses, "pb-5 sm:pb-6")
const headClasses = "flex flex-wrap items-start justify-between gap-x-4 gap-y-3"
const nameClasses = "font-sans text-2xl font-bold text-balance break-words text-blue-chalk"
const codeClasses = "mt-1 font-mono text-sm tracking-wide text-prelude"
// Holds the trail's height while payment loads, so nothing shifts or replays.
const trailPlaceholderClasses = "mt-5 h-[42px]"
const accordionClasses = "mt-5 border-t border-blue-chalk/10"
// Neutral icon and hover: aquamarine is kept for the one action on the page.
const triggerClasses =
  "py-4 text-sm hover:text-blue-chalk focus-visible:text-blue-chalk pointer-coarse:min-h-11 [&_svg]:text-prelude"
const contentClasses = "pb-6 [&_p:not(:last-child)]:mb-0"
const editorClasses = "mt-6 border-t border-blue-chalk/10"

type ApplicantIdentityPanelProps = {
  application: ApplicantApplication
  state: ApplicantDashboardState
  /** Null until the payment record has loaded. */
  trail: R101Trail | null
  onApplicationUpdated: (application: ApplicantApplication) => void
}

export function ApplicantIdentityPanel({ application, state, trail, onApplicationUpdated }: ApplicantIdentityPanelProps) {
  const editing = application.canEdit && !application.result

  return (
    <section className={application.officer ? officerPanelClasses : panelClasses} aria-labelledby="applicant-name">
      <div className={headClasses}>
        <div className="min-w-0">
          <h3 id="applicant-name" className={nameClasses}>
            {application.firstName} {application.lastName}
          </h3>
          <p className={codeClasses}>{application.applicationCode}</p>
        </div>
        <ApplicantStatusChip {...state.chip} />
      </div>
      {trail ? <ApplicantR101Trail trail={trail} /> : <div className={trailPlaceholderClasses} aria-hidden />}
      {application.officer ? null : (
      <Accordion className={accordionClasses} defaultValue={editing ? ["details"] : []}>
        <AccordionItem value="details">
          <AccordionTrigger className={triggerClasses}>Your application</AccordionTrigger>
          <AccordionContent className={contentClasses}>
            <ApplicantDashboardProfile application={application} showDocuments={!editing} />
            {editing ? (
              <div className={editorClasses}>
                <ApplicantDocumentEditor application={application} onUpdated={onApplicationUpdated} />
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      )}
    </section>
  )
}
