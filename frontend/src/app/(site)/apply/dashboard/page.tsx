import { ApplicantDashboard } from "@/components/apply/applicant-dashboard"
import { SectionHeader } from "@/components/section-header"
import { pageShellClasses } from "@/lib/surface"

export default function ApplicantDashboardPage() {
  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// APPLICANT DASHBOARD"
        title="Your application"
        subtitle="Review what you submitted. Committee choices can be changed only during recruitment week."
      />
      <ApplicantDashboard />
    </main>
  )
}
