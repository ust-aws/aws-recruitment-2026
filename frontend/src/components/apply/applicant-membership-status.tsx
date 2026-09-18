import type { ApplicantApplication } from "@/lib/api/applicant"
import { glassPanelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} mt-6 rounded-[22px] px-5 py-5`
const eyebrowClasses =
  "font-mono text-[10px] uppercase tracking-[0.16em] text-aquamarine"
const headingClasses = "mt-2 font-sans text-2xl font-bold text-blue-chalk"
const bodyClasses = "mt-2 font-sans text-sm leading-relaxed text-prelude"

export function ApplicantMembershipStatus({
  application,
}: {
  application: ApplicantApplication
}) {
  return (
    <section className={panelClasses} aria-labelledby="membership-status-title">
      <p className={eyebrowClasses}>Member-only application</p>
      <h2 id="membership-status-title" className={headingClasses}>
        Membership registration accepted
      </h2>
      <p className={bodyClasses}>
        No interview is required. Membership payment will open after R101, so
        please wait for the official instructions and do not send a payment yet.
      </p>
      <p className={bodyClasses}>Application ID: {application.applicationCode}</p>
    </section>
  )
}