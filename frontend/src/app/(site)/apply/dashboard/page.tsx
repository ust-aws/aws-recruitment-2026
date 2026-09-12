import { ApplicantDashboard } from "@/components/apply/applicant-dashboard"
import { SectionHeader } from "@/components/section-header"
import { pageShellClasses } from "@/lib/surface"

export default function ApplicantDashboardPage() {
  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// APPLICANT DASHBOARD"
        title="Your application"
        subtitle="Review what you submitted and update committee choices, documents, or your interview while recruitment week is open."
      />
      <ApplicantDashboard />
    </main>
  )
}
