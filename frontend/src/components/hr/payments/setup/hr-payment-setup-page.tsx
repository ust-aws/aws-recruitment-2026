"use client"

import { HrPaymentCampaignPanel } from "@/components/hr/payments/setup/hr-payment-campaign-panel"
import { useHrPaymentWorkspace } from "@/components/hr/payments/use-hr-payment-workspace"
import { ActionFeedback } from "@/components/shared/action-feedback"
import { SectionHeader } from "@/components/shared/section-header"
import { Skeleton } from "@/components/ui/skeleton"
import { periodLine } from "@/lib/payments/workspace"
import { dashboardTitleClasses } from "@/lib/site/dashboard-surface"
import { hrPageShellClasses } from "@/lib/site/surface"

const bodyClasses = "mt-6 flex flex-col gap-4"

/** Payment Setup: the period, the amount and the GCash QR codes, apart from the receipt queue. */
export function HrPaymentSetupPage() {
  const { campaign, committees, role, feedback, setFeedback, loading, loadError, pending, setCampaign, setPending } =
    useHrPaymentWorkspace()

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// PAYMENT PERIOD"
        title="Payment Setup"
        titleClassName={dashboardTitleClasses}
        level="h1"
        subtitle={loading || loadError ? undefined : periodLine(campaign)}
      />
      <div className={bodyClasses}>
        {loading ? (
          <Skeleton className="h-96 w-full rounded-xl" role="status" aria-label="Loading payment setup" />
        ) : loadError ? (
          <ActionFeedback type="error" message={loadError} />
        ) : (
          <>
            {feedback ? <ActionFeedback type={feedback.type} message={feedback.message} /> : null}
            <HrPaymentCampaignPanel
              campaign={campaign}
              committees={committees}
              role={role}
              pending={pending}
              onCampaign={setCampaign}
              onPending={setPending}
              onFeedback={setFeedback}
            />
          </>
        )}
      </div>
    </main>
  )
}
