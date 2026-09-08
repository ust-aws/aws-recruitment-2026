import { ApplicantAccessForm } from "@/components/apply/applicant-access-form"
import { SectionHeader } from "@/components/section-header"
import { pageShellClasses } from "@/lib/surface"

export default function ApplicantStatusPage() {
  return (
    <main className={pageShellClasses}>
      <SectionHeader
        eyebrow="// APPLICANT ACCESS"
        title="Already applied?"
        subtitle="Enter your Application ID and UST email. We’ll send a one-time code so only you can access your application."
      />
      <ApplicantAccessForm />
    </main>
  )
}
