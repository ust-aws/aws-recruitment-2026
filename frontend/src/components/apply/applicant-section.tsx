import type { ReactNode } from "react"
import Image from "next/image"
import {
  applicantSectionAreaClasses,
  applicantSectionPanelClasses,
  applicantSectionStatusClasses,
  applicantSectionTitleClasses,
} from "@/components/apply/applicant-section-classes"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const bodyClasses = "mt-5"

// Milestone: the newest thing the applicant earned (their committee, their ID)
// opens on the ID card's night sky, with Espi rising out of the clouds.
const milestonePanelClasses = cn(dashboardPanelClasses, "min-w-0 overflow-hidden")
const bandClasses = "relative isolate min-h-44 overflow-hidden px-5 pb-10 pt-6 sm:px-6"
const skyClasses = "-z-20 object-cover object-[50%_80%]"
// Keeps the text side of the sky dark enough to read.
const shadeClasses = "absolute inset-0 -z-10 bg-linear-to-r from-haiti/80 via-haiti/40 to-transparent"
// Clears Espi on the right; the status keeps a reading measure.
const bandTextClasses = "pr-24 sm:pr-48"
const bandAreaClasses = "font-mono text-xs uppercase tracking-[0.14em] text-blue-chalk/80"
const bandStatusClasses = "mt-1.5 font-sans text-sm leading-relaxed text-pretty text-blue-chalk/85"
const espiClasses =
  "espi-rise pointer-events-none absolute -bottom-6 right-2 h-auto w-28 drop-shadow-[0_8px_18px_rgb(23_15_51/0.45)] sm:right-6 sm:w-36"
const milestoneBodyClasses = "px-5 pb-5 pt-5 sm:px-6 sm:pb-6"

type ApplicantSectionProps = {
  /** Area label without the slashes, e.g. "FINAL RESULT". */
  area: string
  title: ReactNode
  titleId: string
  status?: ReactNode
  children?: ReactNode
  className?: string
  milestone?: boolean
}

function MilestoneBand({ area, title, titleId, status }: Omit<ApplicantSectionProps, "children" | "className" | "milestone">) {
  return (
    <div className={bandClasses}>
      <Image src="/member-id/back-bg.webp" alt="" fill sizes="(min-width: 768px) 56rem, 100vw" className={skyClasses} />
      <span className={shadeClasses} aria-hidden />
      <div className={bandTextClasses}>
        <p className={bandAreaClasses}>{`// ${area}`}</p>
        <h3 id={titleId} className={applicantSectionTitleClasses}>
          {title}
        </h3>
        {status ? <p className={bandStatusClasses}>{status}</p> : null}
      </div>
      <Image src="/espi.webp" alt="" width={1080} height={1080} sizes="9rem" className={espiClasses} aria-hidden />
    </div>
  )
}

export function ApplicantSection({ area, title, titleId, status, children, className, milestone = false }: ApplicantSectionProps) {
  if (milestone) {
    return (
      <section className={cn(milestonePanelClasses, className)} aria-labelledby={titleId}>
        <MilestoneBand area={area} title={title} titleId={titleId} status={status} />
        {children ? <div className={milestoneBodyClasses}>{children}</div> : null}
      </section>
    )
  }

  return (
    <section className={cn(applicantSectionPanelClasses, className)} aria-labelledby={titleId}>
      <p className={applicantSectionAreaClasses}>{`// ${area}`}</p>
      <h3 id={titleId} className={applicantSectionTitleClasses}>
        {title}
      </h3>
      {status ? <p className={applicantSectionStatusClasses}>{status}</p> : null}
      {children ? <div className={bodyClasses}>{children}</div> : null}
    </section>
  )
}
