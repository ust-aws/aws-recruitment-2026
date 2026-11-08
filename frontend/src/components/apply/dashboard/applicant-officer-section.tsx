import { ApplicantOfficerDetails } from "@/components/apply/dashboard/applicant-officer-details"
import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"
import type { ApplicantApplication, OfficerInfo } from "@/lib/api/applicant"

const idClasses = "font-mono text-2xl font-bold tracking-wide text-blue-chalk tabular-nums"
const labelClasses = "font-sans text-xs text-prelude"
const bodyClasses = "flex flex-col gap-6"

type OfficerSectionProps = {
  application: ApplicantApplication
  officer: OfficerInfo
  onUpdated: (application: ApplicantApplication) => void
}

/** Result area for elected officers and advisers: their Member ID, held until they pay. */
export function ApplicantOfficerSection({ application, officer, onUpdated }: OfficerSectionProps) {
  const issued = Boolean(application.memberId)
  const adviser = officer.kind === "adviser"
  const memberId = application.memberId ?? officer.reservedMemberId

  return (
    <ApplicantSection
      area="MEMBER ID"
      titleId="officer-member-id-title"
      title={issued ? officer.title : memberId ? "Your Member ID is reserved" : `Welcome, ${officer.title}`}
      status={
        issued
          ? "Your official Member ID is active."
          : memberId
            ? "This number is held for your seat. It is released, with your digital member ID, once your membership payment is verified."
            : "Your Member ID is issued, with your digital member ID, once your membership payment is verified."
      }
    >
      <div className={bodyClasses}>
        {memberId ? (
          <div>
            <p className={labelClasses}>{issued ? "Member ID" : "Reserved Member ID"}</p>
            <p className={idClasses}>{memberId}</p>
          </div>
        ) : null}
        {adviser ? null : <ApplicantOfficerDetails application={application} onUpdated={onUpdated} />}
      </div>
    </ApplicantSection>
  )
}
