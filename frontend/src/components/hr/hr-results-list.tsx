import Link from "next/link"
import type {
  ResultClassification,
  ResultPreviewApplication,
} from "@/lib/api/client"
import { cn } from "@/lib/utils"

const listClasses = "flex flex-col gap-3"
const rowClasses =
  "rounded-[20px] border border-blue-chalk/15 bg-haiti/55 px-5 py-4"
const rowHeaderClasses =
  "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
const nameClasses = "font-sans text-base font-semibold text-blue-chalk"
const codeClasses = "mt-1 font-mono text-xs text-aquamarine"
const emailClasses = "mt-1 font-sans text-xs text-prelude"
const detailClasses = "mt-3 font-sans text-sm text-prelude"
const linkClasses =
  "mt-3 inline-flex font-mono text-xs text-aquamarine underline-offset-4 hover:text-blue-chalk hover:underline"
const pillBaseClasses =
  "inline-flex w-fit rounded-pill px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wide"
const pillClasses: Record<ResultClassification, string> = {
  accepted: "bg-aquamarine text-haiti",
  rejected: "bg-haiti text-prelude",
  incomplete: "bg-rose-deep/55 text-rose-glow",
}

function resultDetail(application: ResultPreviewApplication) {
  if (application.classification === "accepted") {
    return application.finalPlacement
      ? `${application.finalPlacement.committee} — ${application.finalPlacement.title}`
      : "Final placement missing"
  }
  if (application.classification === "rejected") {
    return "Both committee choices were rejected."
  }
  return application.blockingReason ?? "This application is incomplete."
}

export function HrResultsList({
  applications,
}: {
  applications: ResultPreviewApplication[]
}) {
  if (applications.length === 0) {
    return (
      <p className="font-sans text-sm text-prelude">
        No unreleased applications in this recruitment cycle.
      </p>
    )
  }

  return (
    <ul className={listClasses}>
      {applications.map((application) => (
        <li key={application.id} className={rowClasses}>
          <div className={rowHeaderClasses}>
            <div>
              <p className={nameClasses}>{application.applicant.fullName}</p>
              <p className={codeClasses}>{application.applicationCode}</p>
              <p className={emailClasses}>{application.applicant.email}</p>
            </div>
            <span
              className={cn(
                pillBaseClasses,
                pillClasses[application.classification]
              )}
            >
              {application.classification}
            </span>
          </div>
          <p className={detailClasses}>{resultDetail(application)}</p>
          <Link href={`/admin/hr/${application.id}`} className={linkClasses}>
            Review application
          </Link>
        </li>
      ))}
    </ul>
  )
}
