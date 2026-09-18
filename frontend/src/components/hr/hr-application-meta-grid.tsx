import { formatAppliedDate } from "@/lib/api"
import type { HrApplication } from "@/lib/types/hr-application"
import { formatApplicantGender } from "@/lib/apply/applicant-gender"
import { formatDateDisplay } from "@/lib/datetime/date-local"
import { safeExternalHref } from "@/lib/site/safe-external-href"

const metaGridClasses =
  "grid min-w-0 grid-cols-1 gap-3 font-sans text-sm text-blue-chalk sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3"
const metaItemClasses = "min-w-0"
const metaEmailItemClasses = "min-w-0 sm:col-span-2"
const metaLabelClasses = "mr-2 text-prelude"
const metaValueClasses = "min-w-0 [overflow-wrap:anywhere]"
const linkClasses =
  "text-aquamarine underline-offset-2 hover:text-blue-chalk hover:underline"

type HrApplicationMetaGridProps = {
  application: HrApplication
}

export function HrApplicationMetaGrid({ application }: HrApplicationMetaGridProps) {
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")

  return (
    <div className={metaGridClasses}>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Application ID:</span>
        <span className={metaValueClasses}>{application.applicationCode}</span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Year & Section:</span>
        <span className={metaValueClasses}>{application.section ?? "—"}</span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Age:</span>
        <span className={metaValueClasses}>{application.age ?? "—"}</span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Birthday:</span>
        <span className={metaValueClasses}>
          {application.birthday
            ? formatDateDisplay(application.birthday, "—")
            : "—"}
        </span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Gender:</span>
        <span className={metaValueClasses}>
          {formatApplicantGender(application.gender)}
        </span>
      </p>
      <p className={metaEmailItemClasses}>
        <span className="block text-prelude">Email:</span>
        <span className={metaValueClasses} title={application.email}>
          {application.email}
        </span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Student No.:</span>
        <span className={metaValueClasses}>
          {application.studentNumber ?? "—"}
        </span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Contact:</span>
        <span className={metaValueClasses}>
          {application.contactNumber ?? "—"}
        </span>
      </p>
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Facebook:</span>
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
          <span className={metaValueClasses}>—</span>
        )}
      </p>
      {portfolioHref ? (
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>Portfolio:</span>
          <a
            href={portfolioHref}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            Google Drive
          </a>
        </p>
      ) : null}
      {githubHref ? (
        <p className={metaItemClasses}>
          <span className={metaLabelClasses}>GitHub:</span>
          <a
            href={githubHref}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            Profile
          </a>
        </p>
      ) : null}
      <p className={metaItemClasses}>
        <span className={metaLabelClasses}>Applied:</span>
        <span className={metaValueClasses}>
          {formatAppliedDate(application.submittedAt)}
        </span>
      </p>
    </div>
  )
}
