import { redirect } from "next/navigation"
import { ApplicantDashboard } from "@/components/apply/applicant-dashboard"
import { SectionHeader } from "@/components/shared/section-header"
import { getApplicantServerSession } from "@/lib/auth/applicant-session-server"
import { applyFlowShellClasses } from "@/lib/site/surface"

export default async function ApplicantDashboardPage() {
  const session = await getApplicantServerSession()
  if (!session) redirect("/apply/status")
  return (
    <main className={`${applyFlowShellClasses} gap-10`}>
      <SectionHeader
        eyebrow="// APPLICANT DASHBOARD"
        title="Your application"
        titleClassName="max-w-none text-balance"
        subtitle="Review what you submitted and update committee choices, documents, or your interview while recruitment week is open."
      />
      <ApplicantDashboard />
    </main>
  )
}
