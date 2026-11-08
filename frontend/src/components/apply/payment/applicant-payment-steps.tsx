"use client"

import { ApplicantPaymentForm } from "@/components/apply/payment/applicant-payment-form"
import { ApplicantPaymentMethodCard } from "@/components/apply/payment/applicant-payment-method-card"
import { ApplicantPaymentSection } from "@/components/apply/payment/applicant-payment-section"
import type { ApplicantPayment } from "@/lib/api/applicant"
import { dashboardCaptionClasses } from "@/lib/site/dashboard-surface"

const stepsClasses = "flex flex-col gap-5"
const methodGridClasses = "flex flex-wrap justify-center gap-6"
const noteClasses = "font-sans text-sm leading-relaxed text-pretty text-blue-chalk"
const problemClasses = "font-sans text-sm leading-relaxed text-pretty text-rose-glow"

type StepsProps = { payment: ApplicantPayment; onSubmitted: () => Promise<void> }

/** Pay, then submit the receipt: shown while a payment is due or needs resubmitting. */
export function ApplicantPaymentSteps({ payment, onSubmitted }: StepsProps) {
  if (payment.paymentStatus !== "awaiting_payment" && payment.paymentStatus !== "needs_resubmission") return null
  const reviewReason = payment.latestSubmission?.reviewReason
  return (
    <div className={stepsClasses}>
      {reviewReason ? <p className={problemClasses}>Reviewer note: {reviewReason}</p> : null}
      <ApplicantPaymentSection
        number="01"
        title="Payment instructions"
        description="Pay using the official account below before submitting your receipt."
      >
        <div className={methodGridClasses}>
          {payment.paymentMethods.gcash ? <ApplicantPaymentMethodCard label="GCash" details={payment.paymentMethods.gcash} /> : null}
          {payment.paymentMethods.bpi ? <ApplicantPaymentMethodCard label="BPI" details={payment.paymentMethods.bpi} /> : null}
        </div>
      </ApplicantPaymentSection>
      <ApplicantPaymentSection
        number="02"
        title="Submit proof of payment"
        description="Enter the reference number and a Google Drive link to a clear screenshot of your receipt for manual verification."
      >
        {payment.canSubmit ? (
          <ApplicantPaymentForm payment={payment} onSubmitted={onSubmitted} />
        ) : (
          <p className={dashboardCaptionClasses}>Payment submission is currently closed.</p>
        )}
      </ApplicantPaymentSection>
    </div>
  )
}

/** One line for the states with nothing to submit. */
export function ApplicantPaymentStatusMessage({ payment }: { payment: ApplicantPayment }) {
  if (payment.paymentStatus === "pending_verification") {
    return (
      <p className={noteClasses}>
        Your receipt is waiting for manual review. It does not count as paid until Finance verifies it.
      </p>
    )
  }
  if (payment.paymentStatus === "expired") {
    return <p className={problemClasses}>The payment deadline has passed. Contact the organization if you need help.</p>
  }
  return null
}
