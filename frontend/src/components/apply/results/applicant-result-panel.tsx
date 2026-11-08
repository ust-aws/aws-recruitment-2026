import { ApplicantRedirectResponse } from "@/components/apply/results/applicant-redirect-response"
import { ApplicantRejectedChoices } from "@/components/apply/results/applicant-rejected-choices"
import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"
import type { ApplicantApplication, ApplicantChoice, ApplicantResult } from "@/lib/api/applicant"
import { isAccepted, isRedirectPending, resolvePlacement, type Placement } from "@/lib/apply/dashboard-state"
import { formatDisplayDate } from "@/lib/datetime/display"

const AREA = "FINAL RESULT"
const TITLE_ID = "application-result-title"
const offerBodyClasses = "font-sans text-sm leading-relaxed text-pretty text-blue-chalk"

function releasedOn(result: ApplicantResult) {
  return formatDisplayDate(new Date(result.releasedAt), { month: "long", day: "numeric", year: "numeric" })
}

function roleLine(placement: Placement) {
  return placement.title !== placement.committee ? placement.title : null
}

function RedirectOffer({
  placement,
  hunt,
  onApplicationUpdated,
}: {
  placement: Placement
  hunt: boolean
  onApplicationUpdated: (application: ApplicantApplication) => void
}) {
  const role = roleLine(placement)
  return (
    <ApplicantSection
      area={AREA}
      titleId={TITLE_ID}
      title={placement.committee}
      status={role ? `Offered position: ${role}` : "Offered placement"}
    >
      <p className={offerBodyClasses}>
        {hunt
          ? "The panel offered you this seat instead of your choices. Accept it to take the seat, or decline. Your answer is final, and accepting seats you right away."
          : "Officers offered you this placement instead of your choices. Accept it to join this committee, or decline to continue as a general member. Your answer is final, and payment instructions follow it."}
      </p>
      <ApplicantRedirectResponse
        position={placement.title}
        committee={placement.committee}
        hunt={hunt}
        onApplicationUpdated={onApplicationUpdated}
      />
    </ApplicantSection>
  )
}

export function ApplicantResultPanel({
  result,
  choices,
  hunt = false,
  milestone,
  onApplicationUpdated,
}: {
  result: ApplicantResult
  choices: ApplicantChoice[]
  /** An officer hunt result, which is not followed by general membership. */
  hunt?: boolean
  /** The acceptance is the applicant's newest milestone (no ID yet). */
  milestone: boolean
  onApplicationUpdated: (application: ApplicantApplication) => void
}) {
  const placement = resolvePlacement(result)

  if (isRedirectPending(result) && placement) {
    return <RedirectOffer placement={placement} hunt={hunt} onApplicationUpdated={onApplicationUpdated} />
  }

  if (isAccepted(result) && placement) {
    const role = roleLine(placement)
    return (
      <ApplicantSection
        area={AREA}
        titleId={TITLE_ID}
        title={placement.committee}
        status={`${role ? `Accepted as ${role}` : "Accepted"} · released ${releasedOn(result)}`}
        milestone={milestone}
      />
    )
  }

  return (
    <ApplicantSection
      area={AREA}
      titleId={TITLE_ID}
      title="Not selected this term"
      status={
        hunt
          ? result.redirectResponse === "declined"
            ? "You declined the offered seat. Thank you for running. You can still apply to R101 when it opens."
            : "Thank you for running. You were not selected for a seat this term. You can still apply to R101 when it opens."
          : result.redirectResponse === "declined"
            ? "You declined the offered placement. Thank you for your interest. You can still continue as a general member."
            : "Thank you for applying. You were not selected for a committee position this term. You can still continue as a general member."
      }
    >
      <ApplicantRejectedChoices choices={choices} />
    </ApplicantSection>
  )
}
