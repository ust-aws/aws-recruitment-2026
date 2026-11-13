"use client"

import dynamic from "next/dynamic"
import { ApplicantChoiceCards } from "@/components/apply/results/applicant-choice-cards"
import { ApplicantChoiceEditor } from "@/components/apply/results/applicant-choice-editor"
import { ApplicantGroupLinks } from "@/components/apply/dashboard/applicant-group-links"
import { ApplicantIdentityPanel } from "@/components/apply/dashboard/applicant-identity-panel"
import { ApplicantMembershipStatus } from "@/components/apply/dashboard/applicant-membership-status"
import { ApplicantOfficerSection } from "@/components/apply/dashboard/applicant-officer-section"
import { ApplicantPaymentPanel } from "@/components/apply/payment/applicant-payment-panel"
import { ApplicantResultPanel } from "@/components/apply/results/applicant-result-panel"
import { ApplicantSection } from "@/components/apply/dashboard/applicant-section"
import { useApplicantPayment, type InitialApplicantPayment } from "@/components/apply/payment/use-applicant-payment"
import { LazyWhenVisible } from "@/components/shared/lazy-when-visible"
import type { ApplicantApplication } from "@/lib/api/applicant"
import { formatEditDeadline, isAccepted, type ApplicantDashboardState } from "@/lib/apply/dashboard-state"
import { r101Trail } from "@/lib/apply/r101-trail"

const ApplicantInterviewScheduler = dynamic(() =>
  import("@/components/apply/interview/applicant-interview-scheduler").then((mod) => mod.ApplicantInterviewScheduler),
)

type SaveInput = {
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  slotId?: string
  portfolioUrl?: string
  githubUrl?: string
}

type ApplicantDashboardContentProps = {
  application: ApplicantApplication
  state: ApplicantDashboardState
  initialPayment: InitialApplicantPayment
  pending: boolean
  saveError: string
  saveSuccess: string
  previewPositionId: string | undefined
  previewSlotId: string
  onPreviewSlotIdChange: (slotId: string) => void
  onPreviewPositionIdChange: (positionId: string | undefined) => void
  onSave: (input: SaveInput) => void
  onApplicationUpdated: (application: ApplicantApplication) => void
}

function editStatus(application: ApplicantApplication) {
  if (!application.canEdit) return application.lockReason ?? "This application can no longer be edited."
  const until = application.editDeadline ? formatEditDeadline(application.editDeadline) : "the end of recruitment week"
  return `You can change these until ${until}.`
}

/** Before results: the choices, the interview booking, then the editor that can change both. */
function ApplicantPendingSections(
  props: Omit<ApplicantDashboardContentProps, "state" | "initialPayment" | "onApplicationUpdated">,
) {
  const { application, previewPositionId, previewSlotId } = props
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)

  return (
    <>
      <ApplicantSection
        area="APPLICATION"
        titleId="applicant-choices-title"
        title="Your committee choices"
        status={editStatus(application)}
      >
        <ApplicantChoiceCards first={first} second={second} />
      </ApplicantSection>
      <LazyWhenVisible minHeight="18rem">
        <ApplicantInterviewScheduler
          key={`${previewPositionId ?? "current-booking"}:${first?.committee ?? ""}`}
          positionId={previewPositionId}
          previewMode={Boolean(previewPositionId)}
          selectedSlotId={previewPositionId ? previewSlotId : undefined}
          onSelectedSlotIdChange={previewPositionId ? props.onPreviewSlotIdChange : undefined}
        />
      </LazyWhenVisible>
      {application.canEdit ? (
        <ApplicantSection
          area="EDIT CHOICES"
          titleId="applicant-edit-title"
          title="Change your committee choices"
          status="A new first choice may need a new interview slot from the schedule above."
        >
          <ApplicantChoiceEditor
            application={application}
            pending={props.pending}
            error={props.saveError}
            success={props.saveSuccess}
            slotId={previewSlotId}
            onPreviewPositionIdChange={props.onPreviewPositionIdChange}
            onSave={props.onSave}
          />
        </ApplicantSection>
      ) : null}
    </>
  )
}

export function ApplicantDashboardContent({
  state,
  initialPayment,
  onApplicationUpdated,
  ...props
}: ApplicantDashboardContentProps) {
  const { application } = props
  const result = application.result
  const accepted = result !== null && isAccepted(result)
  const groupLinks = accepted ? result.groupLinks : null
  const payment = useApplicantPayment(initialPayment)
  const trail = payment.loading ? null : r101Trail(application, payment.payment)
  // Only the newest milestone gets the night sky: the ID once it exists,
  // otherwise the acceptance.
  const hasId = Boolean(payment.payment?.memberCard)

  return (
    <>
      <ApplicantIdentityPanel
        application={application}
        state={state}
        trail={trail}
        onApplicationUpdated={onApplicationUpdated}
      />
      {application.officer ? (
        <ApplicantOfficerSection application={application} officer={application.officer} onUpdated={onApplicationUpdated} />
      ) : application.applicationType !== "position" ? (
        <ApplicantMembershipStatus application={application} milestone={accepted && !payment.loading && !hasId} />
      ) : result ? (
        <ApplicantResultPanel
          result={result}
          choices={application.choices}
          hunt={application.track === "officer_hunt"}
          milestone={accepted && !payment.loading && !hasId}
          onApplicationUpdated={onApplicationUpdated}
        />
      ) : (
        <ApplicantPendingSections {...props} />
      )}
      {groupLinks ? <ApplicantGroupLinks {...groupLinks} /> : null}
      <ApplicantPaymentPanel application={application} state={payment} showGroupLinks={!groupLinks} milestone={hasId} />
    </>
  )
}
