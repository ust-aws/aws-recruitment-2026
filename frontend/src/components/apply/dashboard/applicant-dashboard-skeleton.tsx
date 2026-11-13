import { Skeleton } from "@/components/ui/skeleton"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Mirrors the loaded page: identity panel, then a section frame.
const stackClasses = "flex flex-col gap-4"
const panelClasses = cn(dashboardPanelClasses, "px-5 py-5 sm:px-6 sm:py-6")

export function ApplicantDashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-4 w-52 max-w-full" />
      <Skeleton className="h-8 w-64 max-w-full md:h-9" />
      <Skeleton className="h-5 w-full max-w-[560px]" />
    </div>
  )
}

export function ApplicantDashboardSkeleton() {
  return (
    <div className={stackClasses} role="status" aria-busy="true" aria-label="Loading your application">
      <div className={panelClasses}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-60 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-pill" />
        </div>
        <Skeleton className="mt-6 h-5 w-40" />
      </div>
      <div className={panelClasses}>
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="mt-3 h-6 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-[480px]" />
        <Skeleton className="mt-6 h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
