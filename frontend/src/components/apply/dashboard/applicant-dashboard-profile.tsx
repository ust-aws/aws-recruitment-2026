import type { ReactNode } from "react"
import { formatDateDisplay } from "@/lib/datetime/date-local"
import { formatApplicantGender } from "@/lib/apply/applicant-gender"
import type { ApplicantApplication } from "@/lib/api/applicant"
import { safeExternalHref } from "@/lib/site/safe-external-href"
import { cn } from "@/lib/utils"

// What the applicant submitted, as label-over-value facts. Lives inside the
// collapsible "Your application" on the identity panel.
const factsClasses = "grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
const wideClasses = "sm:col-span-2 lg:col-span-3"
const labelClasses = "font-sans text-xs text-prelude"
const valueClasses = "mt-0.5 min-w-0 break-words font-sans text-sm text-blue-chalk"
const linkClasses =
  "text-blue-chalk underline decoration-blue-chalk/35 underline-offset-4 transition-colors hover:text-aquamarine hover:decoration-aquamarine"
const motivationClasses = "mt-0.5 font-sans text-sm leading-relaxed text-pretty whitespace-pre-line text-blue-chalk"

function Fact({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && wideClasses)}>
      <dt className={labelClasses}>{label}</dt>
      <dd className={valueClasses}>{children}</dd>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return "—"
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
      {children}
    </a>
  )
}

export function ApplicantDashboardProfile({
  application,
  showDocuments,
}: {
  application: ApplicantApplication
  /** File names of the submitted PDFs, when the editor is not shown instead. */
  showDocuments: boolean
}) {
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")
  const fileName = (type: string) => application.documents.find((doc) => doc.documentType === type)?.fileName ?? "—"

  return (
    <dl className={factsClasses}>
      <Fact label="Email" wide>
        <span className="break-all">{application.email}</span>
      </Fact>
      <Fact label="Student no.">{application.studentNumber ?? "—"}</Fact>
      <Fact label="Section">{application.section ?? "—"}</Fact>
      <Fact label="Birthday">
        {application.birthday ? formatDateDisplay(application.birthday, "—") : "—"}
        {application.age !== null ? ` · ${application.age} years old` : ""}
      </Fact>
      <Fact label="Gender">{formatApplicantGender(application.gender)}</Fact>
      <Fact label="Contact">{application.contactNumber ?? "—"}</Fact>
      <Fact label="Facebook">
        <ExternalLink href={facebookHref}>Profile</ExternalLink>
      </Fact>
      {portfolioHref ? (
        <Fact label="Portfolio">
          <ExternalLink href={portfolioHref}>Google Drive</ExternalLink>
        </Fact>
      ) : null}
      {githubHref ? (
        <Fact label="GitHub">
          <ExternalLink href={githubHref}>Profile</ExternalLink>
        </Fact>
      ) : null}
      {showDocuments ? (
        <>
          <Fact label="CV">{fileName("resume")}</Fact>
          <Fact label="RegForm">{fileName("registration")}</Fact>
        </>
      ) : null}
      <Fact label="Why AWS Builders – UST?" wide>
        <span className={motivationClasses}>{application.motivation}</span>
      </Fact>
    </dl>
  )
}
