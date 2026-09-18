import type { ReactNode } from "react"
import { formatDateDisplay } from "@/lib/datetime/date-local"
import { formatApplicantGender } from "@/lib/apply/applicant-gender"
import type { ApplicantApplication } from "@/lib/api/applicant"
import { safeExternalHref } from "@/lib/site/safe-external-href"
import { cn } from "@/lib/utils"

const metaGridClasses =
  "mt-6 grid min-w-0 grid-cols-1 gap-3 font-sans text-sm text-blue-chalk sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3"
const metaItemClasses = "min-w-0"
const metaEmailItemClasses = "min-w-0 sm:col-span-2"
const metaLabelClasses = "mr-2 text-prelude"
const metaValueClasses = "min-w-0 break-words text-blue-chalk"
const metaEmailValueClasses = "min-w-0 break-all text-blue-chalk"
const whyLabelClasses = "mt-8 font-sans text-sm font-semibold text-biloba-flower"
const whyBodyClasses =
  "mt-2 min-w-0 font-sans text-sm leading-relaxed text-pretty text-blue-chalk"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"
const headingClasses =
  "font-sans text-3xl font-bold text-balance break-words text-blue-chalk md:text-4xl"
const codeClasses = "mt-2 font-mono text-sm text-aquamarine"

function MetaField({
  label,
  className,
  valueClassName,
  children,
}: {
  label: string
  className?: string
  valueClassName?: string
  children: ReactNode
}) {
  return (
    <p className={cn(metaItemClasses, className)}>
      <span className={metaLabelClasses}>{label}</span>
      <span className={valueClassName ?? metaValueClasses}>{children}</span>
    </p>
  )
}

export function ApplicantDashboardProfile({
  application,
}: {
  application: ApplicantApplication
}) {
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  return (
    <>
      <h1 className={headingClasses}>
        {application.firstName} {application.lastName}
      </h1>
      <p className={codeClasses}>{application.applicationCode}</p>

      <div className={metaGridClasses}>
        <p className={metaEmailItemClasses}>
          <span className="block text-prelude">Email</span>
          <span className={metaEmailValueClasses}>{application.email}</span>
        </p>
        <MetaField label="Age">{application.age ?? "—"}</MetaField>
        <MetaField label="Birthday">
          {application.birthday
            ? formatDateDisplay(application.birthday, "—")
            : "—"}
        </MetaField>
        <MetaField label="Gender">
          {formatApplicantGender(application.gender)}
        </MetaField>
        <MetaField label="Section">{application.section ?? "—"}</MetaField>
        <MetaField label="Student no.">
          {application.studentNumber ?? "—"}
        </MetaField>
        <MetaField label="Contact">
          {application.contactNumber ?? "—"}
        </MetaField>
        <MetaField label="Facebook">
          {facebookHref ? (
            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Profile
            </a>
          ) : (
            "—"
          )}
        </MetaField>
        {portfolioHref ? (
          <MetaField label="Portfolio">
            <a
              href={portfolioHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Google Drive
            </a>
          </MetaField>
        ) : null}
        {githubHref ? (
          <MetaField label="GitHub">
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClasses}
            >
              Profile
            </a>
          </MetaField>
        ) : null}
      </div>

      <p className={whyLabelClasses}>Why AWS Builders – UST?</p>
      <p className={whyBodyClasses}>{application.motivation}</p>
    </>
  )
}
