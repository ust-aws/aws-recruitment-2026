"use client"

import { HrFeedbackBanner } from "@/components/hr/groups/hr-feedback-banner"
import { SectionHeader } from "@/components/shared/section-header"
import { HrPaymentLinksForm } from "@/components/hr/groups/hr-payment-links-form"
import { useHrPaymentWorkspace } from "@/components/hr/payments/use-hr-payment-workspace"
import { glassPanelClasses, hrPageShellClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} mt-6 rounded-[20px] px-5 py-5`
const bodyClasses = "font-sans text-sm leading-relaxed text-prelude"

export function HrGroupsPage() {
  const { campaign, setCampaign, committees, feedback, setFeedback, loading } =
    useHrPaymentWorkspace()

  return (
    <main className={hrPageShellClasses}>
      <SectionHeader
        eyebrow="// MEMBERSHIP"
        title="Community Links"
        subtitle="Set the members Facebook group and the office and committee group chats that accepted applicants are invited to join."
      />
      <HrFeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
      {loading ? (
        <p className={`${bodyClasses} mt-8`}>Loading links…</p>
      ) : (
        <section className={panelClasses}>
          {campaign ? (
            <HrPaymentLinksForm
              campaign={campaign}
              committees={committees}
              onSaved={(saved) => {
                setCampaign(saved)
                setFeedback({ type: "success", message: "Community links saved." })
              }}
            />
          ) : (
            <p className={bodyClasses}>
              Save the payment period on the Payments page before adding community links.
            </p>
          )}
        </section>
      )}
    </main>
  )
}
