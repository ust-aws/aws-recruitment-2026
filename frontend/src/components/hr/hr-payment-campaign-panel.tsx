"use client"

import { Button } from "@/components/ui/button"
import { HrPaymentScheduleForm } from "@/components/hr/hr-payment-campaign-form"
import { HrPaymentDetailsForm } from "@/components/hr/hr-payment-details-form"
import type { CommitteeApplicationStatus } from "@/lib/api/client"
import {
  closePaymentCampaign,
  openPaymentCampaign,
  type PaymentCampaign,
} from "@/lib/api/payments"
import { acceptingPayments } from "@/lib/payments/workspace"
import { dashboardActionTargetClasses, dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Two jobs side by side on wide screens: when payments run (a narrow column)
// and what applicants pay and where (the wide one). Stacked below xl.
const layoutClasses = "grid items-start gap-4 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]"
// Solid like every dashboard working surface; @container lets the forms
// inside lay out by the panel's own width.
const panelClasses = cn(dashboardPanelClasses, "@container min-w-0 px-5 py-5 sm:px-6 sm:py-6")
const titleClasses = "font-sans text-lg font-bold text-blue-chalk"
const bodyClasses = "mt-1 font-sans text-sm leading-relaxed text-prelude"
const toggleClasses = cn("mt-4 w-full sm:w-fit", dashboardActionTargetClasses)
const formClasses = "mt-6"

type Feedback = { type: "success" | "error"; message: string }
type CampaignPanelProps = {
  campaign: PaymentCampaign | null
  committees: CommitteeApplicationStatus[]
  role: "hr" | "admin"
  pending: boolean
  onCampaign: (campaign: PaymentCampaign) => void
  onPending: (pending: boolean) => void
  onFeedback: (feedback: Feedback) => void
}

export function HrPaymentCampaignPanel(props: CampaignPanelProps) {
  return (
    <div className={layoutClasses}>
      <PaymentPeriodPanel {...props} />
      <PaymentDetailsPanel {...props} />
    </div>
  )
}

function PaymentPeriodPanel({ campaign, role, pending, onCampaign, onPending, onFeedback }: CampaignPanelProps) {
  const canManage = role === "hr" || role === "admin"
  // Once the deadline passes the period is over, so the action is to open it again.
  const accepting = campaign ? acceptingPayments(campaign) : false
  return (
    <section className={panelClasses} aria-labelledby="payment-period-title">
      <h2 id="payment-period-title" className={titleClasses}>Payment Period</h2>
      <p className={bodyClasses}>{campaignStatus(campaign)}</p>
      {canManage && campaign ? (
        <Button
          type="button"
          color={accepting ? "danger" : "cyan"}
          className={toggleClasses}
          disabled={pending}
          onClick={() => void updatePaymentPeriod(!accepting, campaign, onCampaign, onPending, onFeedback)}
        >
          {accepting ? "Close payments" : "Open and send invitations"}
        </Button>
      ) : null}
      {canManage ? (
        <div className={formClasses}>
          <HrPaymentScheduleForm campaign={campaign} onSaved={(saved) => { onCampaign(saved); onFeedback({ type: "success", message: scheduleSavedMessage(saved.extensionEmails.queued) }) }} />
        </div>
      ) : null}
    </section>
  )
}

/** A later deadline also emails everyone who hasn't paid, so say how many. */
function scheduleSavedMessage(emailed: number) {
  if (emailed === 0) return "Payment period saved."
  return `Payment period saved. ${emailed} ${emailed === 1 ? "person was" : "people were"} emailed the new deadline.`
}

function PaymentDetailsPanel({ campaign, role, onCampaign, onFeedback }: CampaignPanelProps) {
  if (role !== "hr" && role !== "admin") return null
  return (
    <section className={panelClasses} aria-labelledby="payment-details-title">
      <h2 id="payment-details-title" className={titleClasses}>Amount and GCash QR codes</h2>
      <p className={bodyClasses}>Applicants see the amount and the QR for how they pay.</p>
      <div className={formClasses}>
        {campaign ? (
          <HrPaymentDetailsForm campaign={campaign} onSaved={(saved) => { onCampaign(saved); onFeedback({ type: "success", message: "Payment amount and accounts saved." }) }} />
        ) : (
          <p className={bodyClasses}>Save the payment period before adding the amount and official payment accounts.</p>
        )}
      </div>
    </section>
  )
}

function campaignStatus(campaign: PaymentCampaign | null) {
  if (!campaign) return "Set the payment period to begin."
  const detailsStatus = campaign.amountCents === null ? " · Payment details needed" : ""
  const state = acceptingPayments(campaign) ? "Open" : campaign.isOpen ? "Closed · deadline passed" : "Closed"
  return `${state} · Recruitment year ${campaign.recruitmentYear}${detailsStatus}`
}

function openedMessage(result: Awaited<ReturnType<typeof openPaymentCampaign>>) {
  const who = `${result.members} R101 ${result.members === 1 ? "member" : "members"} and ${result.officers} ${result.officers === 1 ? "officer" : "officers"}`
  return `Payment period opened for ${who}. ${result.emailDelivery.queued} invitation emails are being sent in the background.`
}

async function updatePaymentPeriod(open: boolean, campaign: PaymentCampaign, onCampaign: CampaignPanelProps["onCampaign"], onPending: CampaignPanelProps["onPending"], onFeedback: CampaignPanelProps["onFeedback"]) {
  onPending(true)
  try {
    if (open) {
      const result = await openPaymentCampaign()
      onFeedback({ type: "success", message: openedMessage(result) })
      onCampaign({ ...campaign, isOpen: true })
    } else {
      onCampaign(await closePaymentCampaign())
      onFeedback({ type: "success", message: "Payment submissions closed." })
    }
  } catch (caught) {
    onFeedback({ type: "error", message: caught instanceof Error ? caught.message : "Could not update the payment period." })
  } finally {
    onPending(false)
  }
}
