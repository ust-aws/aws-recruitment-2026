"use client"

import { Button } from "@/components/ui/button"
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
const emailRowClasses = "mt-1 flex flex-wrap items-start gap-3"
const emailActionsClasses = "flex flex-wrap gap-2"
const emailActionClasses = "h-7 rounded-pill px-3 font-mono text-[11px]"

type HrApplicationMetaGridProps = {
  application: HrApplication
  onEditEmail?: () => void
  onResendSuccessEmail?: () => void
}

export function HrApplicationMetaGrid({
  application,
  onEditEmail,
  onResendSuccessEmail,
}: HrApplicationMetaGridProps) {
  const facebookHref = safeExternalHref(application.facebookUrl, "facebook")
  const portfolioHref = safeExternalHref(application.portfolioUrl, "portfolio")
  const githubHref = safeExternalHref(application.githubUrl, "github")
  const canManageEmail = Boolean(onEditEmail || onResendSuccessEmail)

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
      <div className={metaEmailItemClasses}>
        <span className="block text-prelude">Email:</span>
        <div className={emailRowClasses}>
          <span className={metaValueClasses} title={application.email}>
            {application.email}
          </span>
          {canManageEmail ? (
            <div className={emailActionsClasses}>
              {onEditEmail ? (
                <Button
                  type="button"
                  color="purple"
                  className={emailActionClasses}
                  onClick={onEditEmail}
                >
                  Edit Email
                </Button>
              ) : null}
              {onResendSuccessEmail ? (
                <Button
                  type="button"
                  className={emailActionClasses}
                  onClick={onResendSuccessEmail}
                >
                  Resend Success Email
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
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
