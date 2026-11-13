import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Every dashboard section reads the same way: the area it belongs to, a short
// title, one status line, then the detail. Solid panel, no glass.
// Shared so sections that render their own frame (the interview scheduler)
// cannot drift from ApplicantSection.
export const applicantSectionPanelClasses = cn(dashboardPanelClasses, "min-w-0 px-5 py-5 sm:px-6 sm:py-6")
export const applicantSectionAreaClasses = "font-mono text-xs uppercase tracking-[0.14em] text-prelude"
export const applicantSectionTitleClasses = "mt-2 font-sans text-xl font-bold text-balance break-words text-blue-chalk"
export const applicantSectionStatusClasses =
  "mt-1.5 font-sans text-sm leading-relaxed text-pretty text-prelude"
