"use client"

import { ApplicantGroupLinks } from "@/components/apply/applicant-group-links"
import { ApplicantMemberSection } from "@/components/apply/applicant-member-section"
import { ApplicantPaymentStatusMessage, ApplicantPaymentSteps } from "@/components/apply/applicant-payment-steps"
import { ApplicantSection } from "@/components/apply/applicant-section"
import type { ApplicantPaymentState } from "@/components/apply/use-applicant-payment"
import type { ApplicantApplication, ApplicantPayment } from "@/lib/api/applicant"
import { formatDisplayDateTime } from "@/lib/datetime/display"
import { dashboardCaptionClasses } from "@/lib/site/dashboard-surface"

const problemClasses = "font-sans text-sm leading-relaxed text-pretty text-rose-glow"
const pesoFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })

const STATUS_LABELS: Record<ApplicantPayment["paymentStatus"], string> = {
  awaiting_payment: "Awaiting payment",
  pending_verification: "Pending verification",
  verified: "Verified",
  needs_resubmission: "Needs resubmission",
  expired: "Expired",
}

type MemberIdentity = Pick<ApplicantApplication, "firstName" | "lastName" | "studentNumber" | "section">

type ApplicantPaymentPanelProps = {
  application: MemberIdentity
  state: ApplicantPaymentState
  /** Show the payment record's group links, when the result section did not. */
  showGroupLinks: boolean
  /** The ID is the applicant's newest milestone, so it gets the night sky. */
  milestone: boolean
}

export function ApplicantPaymentPanel({ application, state, showGroupLinks, milestone }: ApplicantPaymentPanelProps) {
  const { payment, loading, error, refresh, setMemberCard } = state

  if (loading) return <p className={dashboardCaptionClasses} role="status">Loading membership payment…</p>
  if (error) return <p className={problemClasses} role="alert">{error}</p>
  if (!payment) return null

  if (payment.memberCard) {
    return (
      <>
        {showGroupLinks ? (
          <ApplicantGroupLinks
            membersGroupLink={payment.membersGroupLink}
            committeeChatLink={payment.committeeChatLink}
            committeeName={payment.committeeName}
            coreTeamChatLink={payment.coreTeamChatLink}
          />
        ) : null}
        <ApplicantMemberSection
          card={payment.memberCard}
          application={application}
          milestone={milestone}
          onCardChange={setMemberCard}
        />
      </>
    )
  }
  return <ApplicantPaymentDetails payment={payment} onSubmitted={refresh} />
}

function paymentFacts(payment: ApplicantPayment) {
  const amount = pesoFormatter.format(payment.amountCents / 100)
  // A resubmission date only applies while resubmitting; otherwise the period's deadline.
  const resubmit = payment.paymentStatus === "needs_resubmission"
  const deadlineAt = resubmit && payment.resubmissionDeadlineAt ? payment.resubmissionDeadlineAt : payment.deadlineAt
  const deadline = formatDisplayDateTime(new Date(deadlineAt), {
    dateStyle: "medium",
    timeStyle: "short",
  })
  if (payment.paymentStatus === "expired") return `${amount} · deadline was ${deadline}`
  return `${amount} · ${resubmit ? "resubmit" : "pay"} by ${deadline}`
}

function ApplicantPaymentDetails({ payment, onSubmitted }: { payment: ApplicantPayment; onSubmitted: () => Promise<void> }) {
  return (
    <ApplicantSection
      area="MEMBERSHIP PAYMENT"
      titleId="membership-payment-title"
      title={STATUS_LABELS[payment.paymentStatus]}
      status={paymentFacts(payment)}
    >
      <ApplicantPaymentStatusMessage payment={payment} />
      <ApplicantPaymentSteps payment={payment} onSubmitted={onSubmitted} />
    </ApplicantSection>
  )
}
