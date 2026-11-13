import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"
import type { ApplicantApplication } from "@/lib/api/applicant"

const registeredMessage =
  "No interview is required. Membership payment opens after R101, so please wait for the official instructions and do not send a payment yet."
const acceptedMessage =
  "Membership payment instructions will be sent to your email. Your Member ID will appear here once your payment is verified."

/** Result area for member-only applicants; their group links render as their own section. */
export function ApplicantMembershipStatus({ application, milestone }: { application: ApplicantApplication; milestone: boolean }) {
  const accepted = application.result?.status === "approved"

  return (
    <ApplicantSection
      area="REGISTRATION"
      titleId="membership-status-title"
      title={accepted ? "You're now a member" : "Membership registration accepted"}
      status={accepted ? acceptedMessage : registeredMessage}
      milestone={milestone}
    />
  )
}
