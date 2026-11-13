import { redirect } from "next/navigation"
import { ApplicantDashboard } from "@/components/apply/dashboard/applicant-dashboard"
import {
  getApplicantApplicationServer,
  getApplicantPaymentServer,
} from "@/lib/auth/applicant-application-server"
import { getApplicantServerSession } from "@/lib/auth/applicant-session-server"
import { applyFlowShellClasses } from "@/lib/site/surface"

export default async function ApplicantDashboardPage() {
  const session = await getApplicantServerSession()
  if (!session) redirect("/apply/status")
  // Both on the server, so the R101 trail and the milestone section are
  // right on first paint instead of shifting the page after a client fetch.
  const [initialApplication, initialPayment] = await Promise.all([
    getApplicantApplicationServer(),
    getApplicantPaymentServer(),
  ])
  return (
    <main className={`${applyFlowShellClasses} gap-10`}>
      <ApplicantDashboard initialApplication={initialApplication} initialPayment={initialPayment} />
    </main>
  )
}
